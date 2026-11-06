// Shared game types (DATA_MODEL.md). Data tables in src/data conform to these; systems read them.
import type { ArmFeature, Beard, Brows, EyeShape, FaceMark, HairStyle, LegFeature, NoseShape } from '../engine/draw/players';

/** The person picked in the character creator (src/data/appearance.ts lists the options). */
export type BodyType = 'male' | 'female';

export interface Appearance {
  /** body type (D183); absent on old saves and peers: male */
  sex?: BodyType;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  beard: Beard;
  eyes: string;
  eyeShape: EyeShape;
  nose: NoseShape;
  brows: Brows;
  mark: FaceMark;
  armL: ArmFeature;
  armR: ArmFeature;
  legL: LegFeature;
  legR: LegFeature;
}

/** The five damage types (D80): Physical (white), Magic (blue), Void (grey-black), Fire (red), Holy (yellow). */
export type DamageType = 'physical' | 'magic' | 'void' | 'fire' | 'holy';
export const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'magic', 'void', 'fire', 'holy'];
export type StatusId = 'burn' | 'chill' | 'shock' | 'bleed' | 'poison';
export const STATUS_IDS: readonly StatusId[] = ['burn', 'chill', 'shock', 'bleed', 'poison'];
export type ControlId = 'freeze' | 'blind' | 'hexed' | 'silence' | 'root' | 'hold';
export const CONTROL_IDS: readonly ControlId[] = ['freeze', 'blind', 'hexed', 'silence', 'root', 'hold'];
export type Role = 'fodder' | 'swarm' | 'ranged' | 'caster' | 'support' | 'brute' | 'assassin' | 'tank' | 'hazard';
export const MELEE_ROLES: readonly Role[] = ['fodder', 'brute', 'assassin', 'tank'];
/** Endurance raises max stamina, stamina regen and equip load (D82). */
export type StatId = 'hp' | 'endurance' | 'bonk' | 'slicey' | 'brain' | 'prayer';
export const STAT_IDS: readonly StatId[] = ['hp', 'endurance', 'bonk', 'slicey', 'brain', 'prayer'];
export type Stats = Record<StatId, number>;
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | '-';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const RARITIES: readonly Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export type Slot = 'main' | 'off' | 'head' | 'body' | 'legs' | 'ring';
export type ItemKind = 'weapon' | 'shield' | 'staff' | 'talisman' | 'armor' | 'ring';
export type AttackKind = 'normal' | 'red' | 'pierce' | 'utility';
export type Team = 0 | 1 | 2; // 0 players, 1 enemies, 2 neutral
export type HazardId =
  | 'curePool'
  | 'emberMoss'
  | 'poisonCloud'
  | 'firePuddle'
  | 'acid'
  | 'thorns'
  | 'ice'
  | 'oil'
  | 'slag'
  | 'roots'
  | 'water'
  | 'lava'
  | 'timeBubble'
  | 'voidEdge'
  | 'tendril'
  | 'fireWall'
  | 'consecrate'
  | 'sanctuary'
  | 'voidRift'
  | 'regenAura'
  | 'timeDilation'
  | 'gravityWell'
  | 'bearTrap'
  | 'wind';

/**
 * 'eachPlayerPast(1.0)': every living player's position 1.0 s ago (from the player position history); on a
 * `circle` with `count` n it strikes n points 0.1 s apart along each player's path from there toward the
 * present (Rewind Volley).
 */
export type Anchor = 'self' | 'target' | 'targetPast(1.0)' | 'point' | 'wall' | 'corner' | 'eachPlayer' | 'aim' | 'center' | 'eachPlayerPast(1.0)';

/** Optional fields any pattern may add (DATA_MODEL §3). */
export interface PatternCommon {
  persist?: { hazard: HazardId; durationS: number };
  pullSpeed?: number;
  parryable?: boolean;
  /** extra telegraph time added on top of the attack windup for this pattern */
  delayS?: number;
  /** render only: the animation drawn where this area lands (a VfxId, src/render/skillFx.ts); none = the plain burst */
  vfx?: string;
}

export type PatternDef = PatternCommon &
  (
    | { kind: 'melee'; shape: 'arc' | 'thrust'; angleDeg?: number; r?: number; w?: number; l?: number }
    | {
        kind: 'projectile';
        speed: number;
        r: number;
        homing?: number;
        count?: number;
        spreadDeg?: number;
        onImpact?: PatternDef;
        lob?: boolean;
        pierce?: number;
        returns?: boolean;
        curve?: number;
        range?: number;
        drawId?: string;
      }
    | { kind: 'circle'; r: number; anchor: Anchor; count?: number }
    | { kind: 'ring'; rIn: number; rOut: number | 'edge'; anchor: Anchor }
    | {
        kind: 'line';
        w: number;
        l: number | 'room';
        anchor: Anchor;
        through?: boolean;
        /** the length it reaches is scaled by this (a room-length line stopping short of the wall: D172) */
        lMult?: number;
        count?: number;
        randomAngles?: boolean;
        angleOffsetDeg?: number;
        /** the line runs from the anchor to the aim point (its length ignores `l`): a hammer flying back to its thrower */
        toAim?: boolean;
        /** with count: the lines spread evenly around the anchor like spokes, the first along the facing (count 4 = a cross) */
        spokes?: boolean;
      }
    | { kind: 'cone'; angleDeg: number; r: number | 'room'; anchor: Anchor; count?: number; rotateDeg?: number }
    | {
        kind: 'lanes';
        n: number;
        w: number;
        orientation: 'vertical' | 'horizontal';
        alternate?: boolean;
        setGapS?: number;
        /** a boulder rolls down each lane at this speed after the telegraph (lanes alternate ends) instead of the lane striking at once */
        roll?: { speed: number };
        /** the lanes stay lit for this long after impact, hitting every `tickS` (bellows jets) */
        durationS?: number;
        tickS?: number;
      }
    | { kind: 'grid'; spacing: number; r: number; checkerboard?: boolean; sets?: number; setGapS?: number; pulses?: number }
    | {
        kind: 'sweep';
        angleDeg: number;
        r: number | 'room';
        durationS: number;
        clockwise?: boolean;
        anchor: Anchor;
        tickS?: number;
        w?: number;
        beamLine?: boolean;
        /** this many sweeps at once (anchor 'corner': distinct corners, the second diagonally opposite the first) */
        count?: number;
        /** with count: every other sweep turns the opposite way */
        opposite?: boolean;
        /** breaks along the sweep at set distances from its pivot, to stand in as it passes (D163) */
        gaps?: number;
        gapW?: number;
      }
    | {
        kind: 'expandingRing';
        speed: number;
        thickness?: number;
        gaps: number;
        gapW?: number;
        anchor: Anchor;
        gapBehind?: boolean;
        count?: number;
        spacingS?: number;
        /** one extra gap faces the room centre (within ± this many degrees), the same in every ring of the series */
        centerGapDeg?: number;
      }
    | { kind: 'randomCircles'; n: number; r: number; within?: number; anchor: Anchor; overS?: number }
    | { kind: 'wave'; w: number; speed: number; from: 'north' | 'south' | 'east' | 'west' | 'random' | 'cross'; safeTiles?: 'G'; /** breaks in the wall to slip through (D163) */ gaps?: number; gapW?: number }
    | { kind: 'pockets'; n: number; pocketR: number; anchor?: Anchor }
    | { kind: 'trail'; durationS: number; r: number; hazard: HazardId }
    | { kind: 'beam'; w: number; l: number | 'room'; turnRateDeg: number; durationS: number; tickS: number; anchor: Anchor; count?: number; opposite?: boolean }
    | { kind: 'sequence'; steps: { pattern: PatternDef; delayS: number }[] }
  );

export type BuffStat =
  | 'damagePct'
  | 'attackSpeedPct'
  | 'castSpeedPct'
  | 'moveSpeedPct'
  | 'defenseAll'
  | 'damageTakenPct'
  | 'staminaRegenPct'
  | 'staminaCostPct'
  | 'cooldownPct'
  | 'dodgeRechargeS'
  | 'poiseThreshold'
  | 'bleedBuildupPct'
  | 'bleedBurstPct'
  | 'holyConvertPct'
  | 'holyDamagePct'
  | 'silence'
  | 'poiseDamagePct'
  | 'physicalTakenPct'
  | 'speedMult'
  | `defense:${DamageType}`;

export type EffectTarget = 'self' | 'ally' | 'party' | 'others' | 'enemies' | 'ghost' | 'summoner' | 'allEnemies' | 'nearestAlly' | 'target';

interface EffectBase {
  target?: EffectTarget;
  /** radius for party/ally/enemies targeting */
  r?: number;
  delayS?: number;
}

export type EffectDef = EffectBase &
  (
    | {
        op: 'damage';
        pattern: PatternDef;
        mult?: number;
        base?: number;
        type: DamageType;
        status?: { id: StatusId; buildup: number };
        control?: { id: ControlId; durationS: number };
        poiseDmg?: number;
        knockback?: number;
        critVs?: 'staggered' | `hpBelow(${number})`;
        critMult?: number;
        ignoreFrontGuard?: boolean;
        guaranteedStagger?: boolean;
        pull?: boolean;
        bossPoiseMult?: number;
        root?: number;
        telegraphS?: number;
        undeadMult?: number;
        ticks?: number;
        tickS?: number;
        /** only undead / Abyss enemies are affected */
        onlyUndead?: boolean;
        /** run when this hit kills (Execute refunds its cooldown) */
        onKill?: EffectDef[];
      }
    | {
        op: 'dash';
        distance: number;
        durationS: number;
        toward: 'aim' | 'target' | 'away' | 'behindTarget';
        iframes: 'none' | 'redOnly' | 'all';
        through?: boolean;
        hitOnEntry?: EffectDef;
        hitOnExit?: EffectDef;
        hitOnLand?: EffectDef;
        leap?: boolean;
      }
    | { op: 'teleport'; distance: number; toward: 'aim' | 'random' | 'behindTarget' | 'away' }
    | { op: 'buff'; stat: BuffStat; amount: number; durationS: number; maxStacks?: number; stackOn?: 'kill' | 'hit'; id?: string; onStack?: EffectDef[] }
    | { op: 'debuff'; stat: BuffStat; amount: number; durationS: number }
    | { op: 'heal'; pct: number; overS?: number; interruptible?: boolean; flat?: number; spell?: boolean }
    | { op: 'barrier'; pctMaxHp: number; durationS: number }
    | { op: 'summon'; enemyId: string; count: number; max?: number; lifetimeS?: number; at?: 'self' | 'graves' | 'edges' | 'random' }
    | { op: 'decoy'; count: number; durationS: number; tauntR: number; illusion?: boolean }
    | { op: 'pull' | 'push'; r: number; speed: number; durationS: number; bosses?: 'immune' | `slow(${number})`; at?: 'self' | 'aim' }
    | {
        op: 'zone';
        pattern: PatternDef;
        durationS: number;
        tickS: number;
        tick: EffectDef[];
        enemiesOnly?: boolean;
        alliesOnly?: boolean;
        hazard?: HazardId;
        slowPct?: number;
        follow?: boolean;
        noStatusBuild?: boolean;
        enemyDamagePct?: number;
        burst?: EffectDef;
        /** effects run on allies standing inside each tick (tick runs on foes) */
        allyTick?: EffectDef[];
      }
    | { op: 'wall'; pattern: PatternDef; durationS: number; blocks: ('projectiles' | 'enemies')[] }
    | { op: 'stance'; durationS: number; onHitTaken: 'parry' | 'ignore'; riposteMult?: number }
    | { op: 'channel'; durationS: number; tickS: number; tick: EffectDef[]; moveSpeedPct: number; hyperArmor?: boolean; followAim?: boolean }
    | { op: 'chain'; jumps: number; r: number; falloff: number; hit: EffectDef }
    | { op: 'modifyNext'; count: number; windowS: number; mods: { powerPct?: number; noCooldown?: boolean; noStamina?: boolean }; what?: 'spell' | 'flask' }
    | { op: 'link'; durationS: number; splitPct: number }
    | { op: 'cleanse'; what: ('statuses' | 'controls')[] }
    | { op: 'reviveValue'; amount: number; lanternAmount?: number; livingHealPct?: number }
    | { op: 'stagger'; durationS: number; bossPoiseMult?: number }
    | { op: 'resetCooldown'; skill: 'this' | 'all' | string; fraction?: number }
    | { op: 'resource'; stamina?: number; hp?: number; shards?: number; glowen?: number; flask?: number; staminaRegenPct?: number; durationS?: number }
    | { op: 'hyperArmor'; durationS: number }
    | { op: 'reveal'; r: number; durationS: number }
    | { op: 'hazard'; pattern: PatternDef; hazard: HazardId; durationS: number }
    | { op: 'onKill' | 'onHit' | 'onBlock' | 'onParry' | 'onDodge' | 'everyNthHit'; n?: number; then: EffectDef[] }
    | { op: 'sequence'; steps: { effect: EffectDef; delayS: number }[] }
    | { op: 'repeat'; count: number; intervalS: number; effect: EffectDef; reaim?: boolean }
    | { op: 'invuln'; durationS: number; alpha?: number }
    | { op: 'charge'; maxS: number; minMult: number; maxMult: number; release: EffectDef; hyperArmor?: boolean }
    | { op: 'taunt'; r: number; durationS: number }
    | { op: 'split'; enemyId: string; count: number; hpMult: number; dmgMult: number }
    | { op: 'resurrect'; max: number; hpPct: number; channelS: number }
    | { op: 'mirror'; count: number; durationS: number }
    | { op: 'roomMod'; mod: 'flood' | 'enrage' | 'lateFee' | 'lightning'; durationS: number }
    | { op: 'pulseHazards'; hazard: HazardId; mult: number; type: DamageType; status?: { id: StatusId; buildup: number } }
    | { op: 'scatter'; distance: number }
    | { op: 'eliteSummon'; count: number; max: number }
    | { op: 'steal'; pct: number }
    /** the source dies (self-destructs, detonations) */
    | { op: 'die'; quiet?: boolean }
    /** the floor inside the pattern falls away into the void for durationS (standing there = the void fall); never under a boss */
    | { op: 'collapseFloor'; pattern: PatternDef; durationS: number }
  );

export interface AttackMove {
  kind: 'lunge' | 'leap' | 'charge' | 'toTarget' | 'behindTarget' | 'teleportAway' | 'converge';
  distance?: number;
  /** charge: until the wall */
  untilWall?: boolean;
  bounces?: number;
  stunOnWallS?: number;
  speed?: number;
  /** charge: a destructible prop (room.trees) that stops it is used up, and the charger is staggered this long */
  propStaggerS?: number;
  /** charge: this many charges in a row, each re-aimed at the target with a fresh telegraph `chargeGapS` before it */
  charges?: number;
  chargeGapS?: number;
}

export interface AttackDef {
  id: string;
  name: string;
  kind: AttackKind;
  pattern?: PatternDef;
  effects?: EffectDef[];
  windupMs: number;
  activeMs?: number;
  recoverMs: number;
  dmgMult: number;
  type: DamageType;
  status?: { id: StatusId; buildup: number };
  control?: { id: ControlId; durationS: number };
  cooldownS: number;
  range: [number, number];
  weight: number;
  budget?: number;
  condition?: string;
  parryable?: boolean;
  knockback?: number;
  grab?: { holdS: number; mult: number; staminaDrain?: number };
  area?: boolean;
  move?: AttackMove;
  /** number of hits in a combo (each hit uses the next of comboMults) */
  comboMults?: number[];
  comboGapMs?: number;
  /** hits a ghost or downed player? never */
  stunAfterS?: number;
  /** attack only usable in this phase or under this hp */
  pull?: { speed: number; durationS: number };
  stamDrain?: number;
  /** projectiles: reflected as parryable */
  hyperArmor?: boolean;
  /** utility triggered on death / passive (not chosen by AI) */
  trigger?: 'onDeath' | 'onHitTwice' | 'hpBelow' | 'passive' | 'onHit' | 'firstSight';
  triggerValue?: number;
  /** effects applied to the victim on hit (attach, steal…) */
  onHitEffects?: EffectDef[];
  /** passive triggers: only while the enemy is moving (trails) */
  onlyWhileMoving?: boolean;
  /** combos: only these hits (0-based) can be parried; the others cannot (overrides `parryable`) */
  parryableHits?: number[];
  /**
   * started, re-aimed at the current target, as soon as this attack's active phase ends (a dive then a nova,
   * repeated dashes, repeated volleys). Never chosen by the AI on its own; its own cooldown is ignored.
   */
  chain?: AttackDef;
  /** two targets, one bar: performed by the phase's split body (BossPhase.passive.splitBody), never by the boss itself */
  body?: 'split';
  /** combos: the attacker turns this many degrees before each later hit instead of re-aiming (a spinning flurry) */
  comboRotateDeg?: number;
  /** strikes along the attacker's gaze instead of at the target; the gaze then turns this many degrees (shown as an arrow) */
  gazeTurnDeg?: number;
}

export type MoveStyle = 'walk' | 'dash' | 'circle' | 'flank' | 'hover' | 'teleport' | 'stationary' | 'burrow' | 'ceiling' | 'orbit' | 'swarm';

export interface EnemyTraits {
  /** front guard blocks this fraction from the front; 1 = unbreakable */
  frontGuard?: number;
  frontGuardArcDeg?: number;
  /** extra damage taken from behind */
  backMult?: number;
  /** turn speed limit deg/s */
  turnRate?: number;
  stealthUntil?: number;
  invisibleBeyond?: number;
  submerged?: boolean;
  /** shell: frontal hits deal this fraction until flipped; flipped duration */
  shell?: { frontMult: number; flipS: number; flippedMult: number };
  /** grants Lightning +40% vs it etc. */
  phasesThroughProps?: boolean;
  blinkWhenApproached?: { r: number; distance: number; cooldownS: number };
  /** teleports away as soon as it is hit (D253: Ignatius on foot); at most once per cooldown */
  teleportOnHit?: { distance: number; cooldownS: number };
  teleportEveryS?: number;
  fadeAfterAttackS?: number;
  revealedByHoly?: number;
  passivePull?: { speed: number; r: number };
  /** hit by any source: no flinch */
  noFlinch?: boolean;
  lightsRoom?: boolean;
  packSize?: [number, number];
  /** pieces orbit target at this radius */
  orbitR?: number;
  /** drifts about the room on its own, a new spot every few seconds, whoever it is fighting (Aurelia's mirrors, D225) */
  drift?: boolean;
  /** contact damage (swarm pieces) mult and cd */
  contact?: { mult: number; cdS: number; status?: { id: StatusId; buildup: number } };
  attachDrain?: number;
  formation?: boolean;
  burnKills?: boolean;
  friendlyFire?: boolean;
  regenPctPerS?: number;
  stayInHalf?: boolean;
  invincible?: boolean;
  hideHpBar?: boolean;
  immobileUntilAggro?: boolean;
  wallAnchored?: boolean;
  illusionCount?: number;
  /** destroys on contact with charge (trees) */
  scale?: number;
  holyMult?: number;
  takesFriendlyFireMult?: number;
  weakpointBehind?: boolean;
  /** only drawn as shadow until it drops */
  ceilingDrop?: boolean;
  noDrops?: boolean;
  noShards?: boolean;
  /** player-look enemy (Hollow Joe) */
  playerLook?: boolean;
  weaponPick?: string[];
  firstSightBuff?: { stat: BuffStat; amount: number; durationS: number };
  /** wandering merchant: never attacks, leaves after three hits */
  merchant?: boolean;
  /** test dummy: cycles its attacks in order on a timer */
  scripted?: boolean;
  /** mimic: dormant chest until woken */
  mimic?: boolean;
  /** ice mirrors reflect player projectiles */
  reflectsProjectiles?: boolean;
  /** never moves farther than this from where it spawned */
  homeRadius?: number;
  /** exact max HP, unscaled by zone, cycle or party size (1-HP ice mirrors) */
  fixedHp?: number;
  /** never takes damage (decorative boss parts such as corner turrets) */
  invulnerable?: boolean;
}

export interface EnemyDef {
  id: string;
  zone: number;
  name: string;
  role: Role;
  mult?: { hp?: number; dmg?: number; speed?: number; poise?: number; shards?: number };
  radius: number;
  resist: Partial<Record<DamageType, number>>;
  /** the enemy's own type for the weakness chart and its colour (D81); derived from its attacks when omitted */
  element?: DamageType;
  statusImmune?: (StatusId | ControlId)[];
  moveStyle: MoveStyle;
  speed?: number;
  preferredRange: number;
  attacks: AttackDef[];
  /** utilities and passive behaviours that are not AI-chosen attacks */
  extras?: AttackDef[];
  frontGuard?: number;
  hyperArmor?: boolean;
  onDeath?: EffectDef[];
  swarm?: { pieces: number };
  traits?: EnemyTraits;
  flavor: string;
  draw: string;
  palette?: string[];
  hitSound?: 'hitFlesh' | 'hitBone' | 'hitMetal' | 'hitSlime';
  undead?: boolean;
  construct?: boolean;
  /** not part of the zone roster (summons, mimic, gary, instructor) */
  special?: boolean;
  /** a non-boss second phase (The Instructor, D107): below this HP its attack list is replaced */
  phase2?: { untilHpPct: number; attacks: AttackDef[]; name?: string; noLeash?: boolean };
}

export interface ArenaChange {
  op:
    | 'setTiles'
    | 'shrinkPlatform'
    | 'hazardFloor'
    | 'darken'
    | 'thornWalls'
    | 'widenLava'
    | 'reverseFloor'
    | 'floodAll'
    | 'iceFloor'
    | 'spawnProps'
    | 'removeProps'
    /** every hazard tile ('~') becomes a live `hazard` (the Forge's lava channel); re-applying replaces the last set */
    | 'hazardTiles'
    /** a moving floor starts (`floor`): a ring that carries bodies round, or a conveyor belt (D95) */
    | 'movingFloor';
  value?: number;
  hazard?: HazardId;
  tiles?: string[];
  /** thornWalls: damage per touch as a multiple of the boss's hit (else the zone thorn damage) */
  mult?: number;
  /** movingFloor: the floor to start */
  floor?: MovingFloorDef;
}

/** How a moving floor is drawn: Tock's brass ring, a whirlpool, an ice floe, a ring of roots, a forge belt. */
export type MovingFloorLook = 'brass' | 'water' | 'ice' | 'roots' | 'forge';

/**
 * A moving floor (D95) that carries every walking body on it, players and enemies alike (flying ones are not
 * carried). `speed` is in px/s: along the ring (positive = clockwise on screen) or along the belt's direction.
 * Rectangles are in room pixels (x, y = top-left corner).
 */
export type MovingFloorDef =
  | { kind: 'ring'; x: number; y: number; rIn: number; rOut: number; speed: number; look: MovingFloorLook }
  | { kind: 'belt'; x: number; y: number; w: number; h: number; dir: 'n' | 's' | 'e' | 'w'; speed: number; look: MovingFloorLook };

export interface SummonDef {
  enemyId: string;
  count: number;
  max: number;
  everyS?: number;
  /** where they appear: around the boss (default) or one in each free room corner (corner turrets) */
  at?: 'boss' | 'corners';
}

export interface BossPhase {
  untilHpPct: number;
  attacks: AttackDef[];
  speedMult: number;
  dmgMult: number;
  arena?: ArenaChange[];
  summons?: SummonDef[];
  name?: string;
  /** the bar fills back up when this phase starts (D253: Ignatius splits when "killed"; the last phase ends at 0 as usual) */
  refillHp?: boolean;
  /** phase-wide passive effects (pull toward face, grow, two targets) */
  passive?: { pull?: { speed: number; r: number }; splitBody?: string; stationaryAt?: 'farThird' | 'center'; scale?: number; projectileSpeedMult?: number };
}

export interface BossDef extends Omit<EnemyDef, 'attacks' | 'role'> {
  role: 'boss';
  phases: BossPhase[];
  arenaId: string;
  introTitle: string;
  introSub: string;
  baseHp?: number;
  /** HP multiplier on the first playthrough only (cycle 0; New Game+ keeps the full amount), D211 */
  firstCycleHpMult?: number;
  music: { root: number; tempo: number; bright: number };
}

export type SpeedClass = 'veryslow' | 'slow' | 'mediumslow' | 'medium' | 'fast' | 'veryfast';

export interface SwingDef {
  windupMs: number;
  activeMs: number;
  recoverMs: number;
  mult: number;
  hitbox: { shape: 'arc'; angleDeg: number; r: number } | { shape: 'thrust'; w: number; l: number } | { shape: 'proj'; speed: number; r: number; pierce?: number };
  step?: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  /** equip load weight (D82) */
  weight: number;
  /** hybrid weapons (D80) also scale with Brain or Prayer and need it */
  grades: { bonk: Grade; slicey: Grade; brain?: Grade; prayer?: Grade };
  req: { bonk: number; slicey: number; brain?: number; prayer?: number };
  /** can only be used two-handed (bows: D88) */
  twoHandOnly?: boolean;
  /** the weapon's own damage type (hybrids: Bonk+Brain Void, Slicey+Brain Magic, Bonk+Prayer Fire, Slicey+Prayer Holy) */
  element?: DamageType;
  speedClass: SpeedClass;
  combo: SwingDef[];
  base1: number;
  stamina: number;
  poiseDmg: number;
  reviveValue: number;
  skills: [string, string, string];
  /** volley (D205): shots per attack, all at once, fanned `spreadDeg` apart either side of the aim */
  ranged?: { speed: number; chargeS?: number; chargeMult?: number; chargePierce?: number; pierceBonk?: number; volley?: { count: number; spreadDeg: number } };
  hyperArmor?: 'all' | 'last' | 'none';
  holyPct?: number;
  bleed?: number;
  backstabMult?: number;
  ripostedCritMult?: number;
  ignoreFrontGuard?: boolean;
  flavor: string;
  draw: string;
  legendaryNames: string[];
}

export interface SkillDef {
  id: string;
  name: string;
  weapon: string;
  key: 0 | 1 | 2;
  cooldownS: number;
  stamina: number;
  castMs?: number;
  /** the aim point is clamped to this range (melee skills land near you) */
  range?: number;
  castHyperArmor?: boolean;
  effect: EffectDef[];
  description: string;
}

export interface SpellDef {
  id: string;
  name: string;
  school: 'brain' | 'prayer';
  req: number;
  castS: number;
  cooldownS: number;
  stamina: number;
  effect: EffectDef[];
  description: string;
  aimed?: boolean;
  element?: DamageType;
  /** buffs the weapon in hand (D131): refuses to cast with a staff, talisman or nothing in the weapon hand */
  weaponBuff?: boolean;
}

export interface ShieldDef {
  id: string;
  name: string;
  weight: number;
  size: 'small' | 'medium' | 'great';
  req: { bonk: number; slicey: number };
  physical: number;
  elemental: number;
  holyVoidBlock?: number;
  stability: number;
  parryS: number | null;
  walkMult?: number;
  thorns?: number;
  blockHealPct?: number;
  legendaryOnly?: boolean;
  flavor: string;
  draw: string;
}

export interface CastingToolDef {
  id: string;
  name: string;
  weight: number;
  school: 'brain' | 'prayer';
  req: number;
  grade: number;
  gradeLetter: Grade;
  castSpeed: number;
  bonus?: { element?: DamageType; pct: number; heals?: boolean };
  flavor: string;
  draw: string;
}

export type ArmorWeight = 'light' | 'medium' | 'heavy';
export interface ArmorSetDef {
  id: string;
  name: string;
  zone: number;
  weight: ArmorWeight;
  pieces: { head: string; body: string; legs: string };
  look: { head: string; body: string; color: string; trim: string };
  flavor: string;
}

export interface RingDef {
  id: string;
  name: string;
  /** table weight, before ITEM_WEIGHT_MULT (D237: 0.8 … 1.5 in game) */
  weight: number;
  floor: Rarity;
  effect: string;
  flavor: string;
}

export type GemTier = 1 | 2 | 3 | 4 | 5;
/** One effect on a gem. The tier belongs to the perk, not the gem: each perk is upgraded on its own. */
export interface GemPerk {
  family: GemFamily;
  tier: GemTier;
  /** the perk's own level 1–50 (D197): ×0.25 of the tier value at 1, ×3 at 50; perks from before it read as 14 */
  level?: number;
  /** its quality roll −0.5 … +0.5 (D197): Green, Blue, Purple or Orange; older perks read as 0 */
  q?: number;
}
/** A gem: 1–3 perks of distinct families, all weapon perks or all armor perks (NG+ gems carry more). */
export interface Gem {
  perks: GemPerk[];
}
export type GemFamily =
  | 'quicksilver'
  | 'tempo'
  | 'fleetfoot'
  | 'brutal'
  | 'ember'
  | 'rime'
  | 'storm'
  | 'dawn'
  | 'dusk'
  | 'leech'
  | 'vigor'
  | 'bulwark'
  | 'hearth'
  | 'zephyr'
  | 'gilt';

export interface Item {
  id: string;
  baseId: string;
  slot: Slot;
  kind: ItemKind;
  rarity: Rarity;
  ilvl: number;
  name: string;
  affixes: { id: string; value: number }[];
  sockets: (Gem | null)[];
  legendaryPower?: string;
  /** extra unlocked skills on top of `skills` (The Instructor's drop: +1) */
  bonusSkills?: number;
  /** weapons: skills unlocked, rolled at drop time by zone and cycle (D89); absent on items from older saves */
  skills?: number;
  /** weapons and casting tools: experience toward the next rarity (D178) */
  xp?: number;
  /** weapons, shields and armour: reinforced with Soul Essence, +0 … +15 (D198) */
  plus?: number;
  /** times it was raised a rarity at a bonfire (D178), for the Legendary achievement (D239); absent if never */
  raised?: number;
  /** a set perk (D243): 3, 5 or 7 worn pieces with the same one give a playstyle bonus; absent on most gear */
  setPerk?: string;
}

export type ConsumableId =
  | 'throwing_knife'
  | 'firebomb'
  | 'frost_jar'
  | 'holy_water'
  | 'stamina_tonic'
  | 'lure'
  | 'shard_pouch';

export type Loadout3 = [string | null, string | null, string | null];

export type ClassId = 'knight' | 'brute' | 'duelist' | 'scholar' | 'cleric' | 'spearman' | 'hunter' | 'nobody' | 'berserker' | 'occultist';

export interface Character {
  playerId: string;
  name: string;
  classId: ClassId;
  level: number;
  stats: Stats;
  shards: number;
  glowen: number;
  flaskMax: number;
  flaskCur: number;
  bossesBeaten: number;
  highestZoneBeaten: number;
  cycle: number;
  /** worn gear; four ring slots since D228 (older saves get ring3 / ring4 empty) */
  equipment: { main: Item | null; off: Item | null; head: Item | null; body: Item | null; legs: Item | null; ring1: Item | null; ring2: Item | null; ring3: Item | null; ring4: Item | null };
  /** second main-hand slot for the quick swap (CONTENT_SPELLS_CLASSES §3) */
  altMain: Item | null;
  /** second off-hand slot, swapped in with Interact + swap weapon (D228); neither its weight nor its effects count until it is in hand */
  altOff: Item | null;
  /** the Bestiary (D229): kills of each enemy and boss, and the bosses seen; absent on older saves */
  bestiary?: { kills: Record<string, number>; seen: string[] };
  twoHanded: boolean;
  bag: Item[];
  gems: Gem[];
  consumables: Partial<Record<ConsumableId, number>>;
  quickSlot: ConsumableId | null;
  knownSpells: string[];
  spellLoadout: { brain: Loadout3; prayer: Loadout3 };
  tears: number;
  /** Soul Essence held, Tier 1 … 5 (D198); absent on older saves */
  essence?: number[];
  /** stat points refunded by a Tear of Undoing, spent for free at a bonfire */
  freePoints: number;
  tutorialDone: boolean;
  /** the creator's look; absent on old saves (the class look is used) */
  appearance?: Appearance;
  /** weapon-class proficiency experience by class (D178); absent on old saves (all zero) */
  proficiency?: Record<string, number>;
}

export interface WorldState {
  seed: string;
  zone: number;
  roomId: string;
  respawnBonfireId: string;
  bonfiresUsed: string[];
  bonfiresUsedByPlayer: Record<string, string[]>;
  bonfiresDiscovered: string[];
  roomsCleared: string[];
  roomsVisited: string[];
  chestsOpened: string[];
  mimicsKilled: string[];
  mimicsAwake: string[];
  reliquariesOpened: string[];
  bossesBeatenThisCycle: number[];
  garyGone: boolean;
  garyStock: Record<string, GaryStockEntry[]>;
  shopStock: Record<string, { item: Item | null; rolls?: number; sold?: boolean }>;
  shardpile?: { zone: number; roomId: string; x: number; y: number; amount: number };
  /** co-op guests' Shardpiles in this world, by playerId (only that player can pick one up) */
  guestPiles?: Record<string, { zone: number; roomId: string; x: number; y: number; amount: number }>;
  bossReliquary?: string[];
  instructorKilled?: boolean;
  /** items left on the floor when the room was left (GAME_DESIGN PROCGEN §4) */
  leftBehind: Record<string, { playerId: string; item: Item; x: number; y: number }[]>;
  /** awakened mimics that still live (they fight when you return) */
  bossKilled: number[];
  /** cutscenes already played this cycle (src/data/story.ts ids: `zone-N`, `boss-intro-N`, `instructor`) */
  cutscenesSeen?: string[];
}

export interface GaryStockEntry {
  kind: 'item' | 'gem' | 'consumable' | 'tear' | 'ring';
  item?: Item;
  gem?: Gem;
  consumable?: ConsumableId;
  count?: number;
  price: number;
  sold: boolean;
}

export interface SaveStats {
  deaths: number;
  kills: number;
  bossKills: number;
  playtimeSec: number;
  elitesKilled: number;
  mimicsKilled: number;
  mimicDeaths: number;
  /** deaths to The Instructor (D207): left out of "never died" for the clean-zone achievements */
  instructorDeaths?: number;
  /** the Statistics screen's counters for this character (src/game/stats.ts; missing in older saves) */
  extra?: Record<string, number>;
}

export interface SaveFile {
  version: number;
  slot: number;
  createdAt: string;
  updatedAt: string;
  character: Character;
  world: WorldState;
  stats: SaveStats;
  /** co-op progress waiting for this world's next Continue (D195): the next zone to open and the zones beaten away */
  pending?: { advanceToZone?: number; beatenZones?: number[] };
}

export type EliteAffix = 'frenzied' | 'armored' | 'vampiric' | 'arcane' | 'molten' | 'frostbound' | 'shielded' | 'summoner';
export const ELITE_AFFIXES: readonly EliteAffix[] = ['frenzied', 'armored', 'vampiric', 'arcane', 'molten', 'frostbound', 'shielded', 'summoner'];

export interface Palette {
  floor: string;
  floor2: string;
  wall: string;
  wallTop: string;
  accent: string;
  hazard: string;
  colors: [string, string, string, string];
}

export interface ZoneDef {
  id: number;
  name: string;
  palette: Palette;
  enemies: string[];
  boss: string;
  music: { root: number; tempo: number; bright: number; scale: number[]; wave: OscillatorType };
  hazardTile: HazardId;
  resist: Partial<Record<DamageType, number>>;
  statusImmune: (StatusId | ControlId)[];
  tagline: string;
}
