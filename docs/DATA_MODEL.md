# Dungeon Joe — Data Model

TypeScript shapes for saves, items, data tables and runtime entities. Source for `src/game/types.ts`,
`src/game/save/*`, `src/data/*`. Keep these as the single source of truth; the build may extend them but
not rename without updating this file.

## 1. Save file (`localStorage` key `dj.save.<slot 1–10>`)

```ts
interface SaveFile {
  version: 1;                       // bump + add a migration in save/migrations.ts
  slot: number;
  createdAt: string; updatedAt: string;   // ISO
  character: Character;
  world: WorldState;
  stats: { deaths: number; kills: number; bossKills: number; playtimeSec: number; elitesKilled: number; mimicsKilled: number; mimicDeaths: number; extra?: Record<string, number> /* Statistics counters, GAME_DESIGN §21 */ };
  pending?: { advanceToZone?: number };   // set by co-op progress credit (D31), consumed on next solo load
}

interface Character {
  playerId: string;                 // uuid, stable for co-op identity
  name: string; classId: ClassId;
  level: number; stats: Stats;      // { hp, stamina, bonk, slicey, brain, prayer }
  shards: number; glowen: number;
  flaskMax: number; flaskCur: number; bossesBeaten: number;   // bossesBeaten drives flaskMax
  highestZoneBeaten: number;        // 0–8
  cycle: number;                    // NG+ count, 0 = first playthrough
  equipment: { main: Item | null; off: Item | null; head: Item | null; body: Item | null; legs: Item | null; ring1: Item | null; ring2: Item | null; };
  twoHanded: boolean;
  bag: Item[];                      // max 60
  gems: Gem[];                      // loose gems in the bag
  consumables: Record<ConsumableId, number>;
  knownSpells: SpellId[];
  spellLoadout: { brain: Loadout3; prayer: Loadout3 };   // one per school (GAME_DESIGN §10)
  tears: number;                    // Tears of Undoing owned
  tutorialDone: boolean;
}
type Loadout3 = [SpellId | null, SpellId | null, SpellId | null];

interface WorldState {
  seed: string;                     // player-entered or generated
  zone: number;                     // 1–8
  roomId: string;                   // current room "z3-r12"
  respawnBonfireId: string;         // "z3-start" | "z3-boss"
  bonfiresUsed: string[];           // first-rest rule (D38) for the owner of this save
  bonfiresUsedByPlayer: Record<string, string[]>;   // same rule for guests, keyed by their playerId (survives rejoin)
  roomsCleared: string[];
  chestsOpened: string[];           // chest ids "z3-r12-c0"
  mimicsKilled: string[]; mimicsAwake: string[];
  reliquariesOpened: string[];
  bossesBeatenThisCycle: number[];  // zone numbers
  garyGone: boolean; garyStock: Record<string, Item[]>;   // per merchant room id
  shopStock: Record<string, { item: Item | null }>;   // per bonfire id: the rotating piece
  shardpile?: { zone: number; roomId: string; x: number; y: number; amount: number };
}
```

Global: `dj.settings` (`Settings`: video, audio, controls bindings, accessibility, aim assist),
`dj.meta` (last slot used, version). Export: a `.dungeonjoe.json` file containing one `SaveFile`; import
validates the schema (zod or a hand-written validator) and refuses unknown versions above the current.

## 2. Items

```ts
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type Slot = 'main' | 'off' | 'head' | 'body' | 'legs' | 'ring';

interface Item {
  id: string;                       // uuid
  baseId: string;                   // e.g. "greathammer", "kite_shield", "arcane_staff", "crypt_rags_body", "lucky_charm"
  slot: Slot;
  kind: 'weapon' | 'shield' | 'staff' | 'talisman' | 'armor' | 'ring';
  rarity: Rarity; ilvl: number;
  name: string;                     // generated display name
  affixes: { id: AffixId; value: number }[];
  sockets: (Gem | null)[];          // length = socket count
  legendaryPower?: LegendaryPowerId;
}
interface GemPerk { family: GemFamily; tier: 1 | 2 | 3 | 4 | 5; }
interface Gem { perks: GemPerk[]; }   // 1–3 perks, distinct families, all weapon or all armor (save v3)
```

Derived at runtime (never stored): base damage/defense from `baseId` + `ilvl`, requirements, skills
unlocked (`tierFromIlvl(ilvl) + (rarity === 'legendary' ? 1 : 0)`, cap 3), total stats with affixes and gems.

## 3. Data tables (`src/data`)

```ts
type DamageType = 'physical' | 'fire' | 'frost' | 'lightning' | 'holy' | 'void';
type StatusId   = 'burn' | 'chill' | 'shock' | 'bleed' | 'poison';                 // meters (GAME_DESIGN §5.5)
type ControlId  = 'freeze' | 'blind' | 'hexed' | 'silence' | 'root' | 'hold';     // fixed-duration control effects
type Role = 'fodder' | 'swarm' | 'ranged' | 'caster' | 'support' | 'brute' | 'assassin' | 'tank' | 'hazard';

interface EnemyDef {
  id: string; zone: number; name: string; role: Role;
  mult?: { hp?: number; dmg?: number; speed?: number };   // × role base
  radius: number; resist: Partial<Record<DamageType, number>>;   // fraction, negative = weak
  statusImmune?: (StatusId | ControlId)[];                // merged with the zone's list
  moveStyle: 'walk' | 'dash' | 'circle' | 'flank' | 'hover' | 'teleport' | 'stationary' | 'burrow' | 'ceiling';
  preferredRange: number;
  attacks: AttackDef[];             // exactly 1 normal + 1–2 specials
  frontGuard?: number;              // fraction of damage blocked from the front
  hyperArmor?: boolean;
  onDeath?: EffectDef[];            // spore burst, split, detonate…
  swarm?: { pieces: number };
  flavor: string; draw: DrawId;
}
interface AttackDef {
  id: string; name: string; kind: 'normal' | 'red' | 'pierce' | 'utility';
  pattern?: PatternDef;             // omitted for pure utilities (summon, buff, teleport…)
  effects?: EffectDef[];            // utilities and on-hit extras (summon, buff, control effects…)
  windupMs: number; activeMs?: number; recoverMs: number;   // telegraph = windupMs for red/pierce
  dmgMult: number; type: DamageType; status?: { id: StatusId; buildup: number };
  control?: { id: ControlId; durationS: number };
  cooldownS: number; range: [number, number]; weight: number;
  budget?: number;                  // max simultaneous users in a room
  condition?: 'allPlayersWithin(<px>)' | 'targetBehind' | 'hpBelow(<pct>)' | 'alliesAlive(<n>)';
  parryable?: boolean;              // default: true for kind 'normal' melee and all projectiles; always false for red/pierce
  knockback?: number; grab?: { holdS: number; mult: number };
  area?: boolean;                   // the [AREA] flag for tests
}

// Pattern primitives (GAME_DESIGN §5.7). Lengths in px; 'room' = to the arena wall; 'edge' = the arena edge.
type PatternDef =
  | { kind: 'melee'; shape: 'arc' | 'thrust'; angleDeg?: number; r?: number; w?: number; l?: number }
  | { kind: 'projectile'; speed: number; r: number; homing?: number /* deg/s */; count?: number; spreadDeg?: number; onImpact?: PatternDef }
  | { kind: 'circle'; r: number; anchor: Anchor }
  | { kind: 'ring'; rIn: number; rOut: number | 'edge'; anchor: Anchor }
  | { kind: 'line'; w: number; l: number | 'room'; anchor: Anchor; through?: boolean /* extends through the target to the wall */ }
  | { kind: 'cone'; angleDeg: number; r: number; anchor: Anchor }
  | { kind: 'lanes'; n: number; w: number; orientation: 'vertical' | 'horizontal'; alternate?: boolean /* two sets A/B */; setGapS?: number }
  | { kind: 'grid'; spacing: number; r: number; checkerboard?: boolean; sets?: number; setGapS?: number; pulses?: number }
  | { kind: 'sweep'; angleDeg: number; r: number; durationS: number; clockwise?: boolean; anchor: Anchor }
  | { kind: 'expandingRing'; speed: number; thickness?: number /* default 36 */; gaps: number; gapW?: number /* default 90 */; anchor: Anchor }
  | { kind: 'randomCircles'; n: number; r: number; within?: number /* px of the anchor, default: whole room */; anchor: Anchor; overS?: number }
  | { kind: 'wave'; w: number; speed: number; from: 'north' | 'south' | 'east' | 'west' | 'random'; safeTiles?: 'G' }
  | { kind: 'pockets'; n: number; pocketR: number; anchor?: Anchor /* pocket 1 is placed on the anchor when given */ }
  | { kind: 'trail'; durationS: number; r: number; hazard: HazardId }
  | { kind: 'beam'; w: number; l: number | 'room'; turnRateDeg: number; durationS: number; tickS: number; anchor: Anchor }
  | { kind: 'sequence'; steps: { pattern: PatternDef; delayS: number }[] };
type Anchor = 'self' | 'target' | 'targetPast(1.0)' | 'point' | 'wall' | 'corner' | 'eachPlayer';
// Any pattern may add: persist?: { hazard: HazardId; durationS: number } (thorns, puddles, ice, roots-as-walls),
// pullSpeed?: number (used by the escapability test), parryable?: boolean (projectiles).
// Pocket placement rule: pockets are placed so that every player has a pocket edge within
// (telegraph − 0.1) × (260 − pullSpeed) − 40 px at telegraph start; if that is impossible the attack is not chosen.

// Effects: the closed vocabulary shared by skills, spells, consumables, legendary powers, elite affixes,
// enemy utilities and on-death effects. Every entry has an optional `target` ('self' | 'ally' | 'party(r)' |
// 'enemies(pattern)' | 'ghost' | 'summoner') and `delayS`.
type EffectDef =
  | { op: 'damage'; pattern: PatternDef; mult?: number; base?: number; type: DamageType; status?: { id: StatusId; buildup: number }; control?: { id: ControlId; durationS: number }; poiseDmg?: number; knockback?: number; critVs?: 'staggered' | 'hpBelow(<pct>)'; critMult?: number }
  | { op: 'dash'; distance: number; durationS: number; toward: 'aim' | 'target' | 'away'; iframes: 'none' | 'redOnly' | 'all'; through?: boolean; hitOnEntry?: EffectDef; hitOnExit?: EffectDef }
  | { op: 'teleport'; distance: number; toward: 'aim' | 'random' | 'behindTarget' }
  | { op: 'buff'; stat: BuffStat; amount: number; durationS: number; maxStacks?: number; stackOn?: 'kill' | 'hit' }
  | { op: 'debuff'; stat: BuffStat; amount: number; durationS: number }
  | { op: 'heal'; pct: number; overS?: number; interruptible?: boolean }
  | { op: 'barrier'; pctMaxHp: number; durationS: number }
  | { op: 'summon'; enemyId: string; count: number; max?: number; lifetimeS?: number }
  | { op: 'decoy'; count: number; durationS: number; tauntR: number }
  | { op: 'pull' | 'push'; r: number; speed: number; durationS: number; bosses?: 'slow(<pct>)' | 'immune' }
  | { op: 'zone'; pattern: PatternDef; durationS: number; tickS: number; tick: EffectDef[]; enemiesOnly?: boolean; alliesOnly?: boolean }
  | { op: 'wall'; pattern: PatternDef; durationS: number; blocks: ('projectiles' | 'enemies')[] }
  | { op: 'stance'; durationS: number; onHitTaken: 'parry' | 'ignore'; riposteMult?: number }
  | { op: 'channel'; durationS: number; tickS: number; tick: EffectDef[]; moveSpeedPct: number }
  | { op: 'chain'; jumps: number; r: number; falloff: number; hit: EffectDef }
  | { op: 'modifyNext'; count: number; windowS: number; mods: { powerPct?: number; noCooldown?: boolean; noStamina?: boolean } }
  | { op: 'link'; durationS: number; splitPct: number }
  | { op: 'cleanse'; what: ('statuses' | 'controls')[] }
  | { op: 'reviveValue'; amount: number }
  | { op: 'stagger'; durationS: number; bossPoiseMult?: number }
  | { op: 'resetCooldown'; skill: 'this' | SkillId | 'all' }
  | { op: 'resource'; stamina?: number; hp?: number; shards?: number; glowen?: number; flask?: number }
  | { op: 'hyperArmor'; durationS: number }
  | { op: 'reveal'; r: number; durationS: number }
  | { op: 'hazard'; pattern: PatternDef; hazard: HazardId; durationS: number }
  | { op: 'onKill' | 'onHit' | 'onBlock' | 'onParry' | 'onDodge' | 'everyNthHit'; n?: number; then: EffectDef[] }   // for legendary powers / affixes
  | { op: 'sequence'; steps: { effect: EffectDef; delayS: number }[] };
type BuffStat = 'damagePct' | 'attackSpeedPct' | 'castSpeedPct' | 'moveSpeedPct' | 'defenseAll' | 'defense:<type>' | 'damageTakenPct'
  | 'staminaRegenPct' | 'staminaCostPct' | 'cooldownPct' | 'dodgeRechargeS' | 'poiseThreshold' | 'bleedBuildupPct' | 'holyConvertPct' | 'silence';
type HazardId = 'poisonCloud' | 'firePuddle' | 'acid' | 'thorns' | 'ice' | 'oil' | 'slag' | 'roots' | 'water' | 'lava' | 'timeBubble' | 'voidEdge';
interface BossDef extends Omit<EnemyDef, 'attacks'> {
  phases: { untilHpPct: number; attacks: AttackDef[]; speedMult: number; dmgMult: number; arena?: ArenaChange[]; summons?: SummonDef[] }[];
  arenaId: string; introTitle: string; introSub: string;
}
interface WeaponDef { id; name; grades: { bonk: Grade; slicey: Grade }; req: { bonk: number; slicey: number }; speedClass; combo: SwingDef[]; base1: number; stamina: number; poiseDmg: number; reviveValue: number; skills: [SkillId, SkillId, SkillId]; ranged?: ProjectileDef; flavor: string; draw: DrawId; }
interface SkillDef { id; name; key: 0 | 1 | 2; cooldownS; stamina; effect: EffectDef[]; description: string; }
interface SpellDef { id; name; school: 'brain' | 'prayer'; req: number; castS; cooldownS; stamina; effect: EffectDef[]; description: string; }
interface ClassDef { id; name; stats: Stats; start: { main: string; off?: string; armor: string[]; spells: SpellId[]; gems?: number }; twoHanded?: boolean; blurb: string; }
interface ZoneDef { id: number; name: string; palette: Palette; enemies: string[8]; boss: string; music: MusicSeed; hazardTile: HazardId; resist: Partial<Record<DamageType, number>>; statusImmune: (StatusId | ControlId)[]; }
```

All tables are plain objects validated at startup in dev (`validateData()`), and by the unit tests listed
in CONTENT_ENEMIES §13 and CONTENT_SPELLS_CLASSES §4.

### 3.1 Vocabulary added during the build (bosses, D58–D69)

- **Patterns:** anchor `eachPlayerPast(1.0)` (strikes along each player's last second of movement); `line.toAim`,
  `line.spokes`; `lanes.roll { speed }` (boulders) and `lanes.durationS / tickS` (lanes that stay lit);
  `sweep.count / opposite` (corner sweeps).
- **AttackDef:** `parryableHits` (which combo hits can be parried), `chain` (an attack that starts when this one
  ends), `comboRotateDeg`, `gazeTurnDeg` (turns its aim after each use), `body: 'split'` (used by a boss's second
  body), `move.propStaggerS / charges / chargeGapS`. **EffectDef:** `collapseFloor`. **Traits:** `fixedHp`,
  `invulnerable`.
- **BossPhase:** `summons` (with `everyS` and `at: 'boss' | 'corners'`), `passive { pull, splitBody, stationaryAt,
  scale, projectileSpeedMult }`, `arena` ops `hazardFloor, hazardTiles, iceFloor, darken, floodAll, thornWalls (mult),
  widenLava, shrinkPlatform, reverseFloor, setTiles, spawnProps, removeProps, movingFloor (floor: MovingFloorDef — a ring
  `{x, y, rIn, rOut, speed}` or a belt `{x, y, w, h, dir, speed}` plus a `look`; kept in `Room.movers`, synced in RoomSync, D95)`.
- **Hazards:** `curePool`, `emberMoss`, `wind`.
- **Room templates:** boss arenas add `K` (boss), `H` (stairs), `g` (grave), `w` (pool), `t` (breakable tree) and an
  optional `rotFloor`; `room.overlay` marks void (1), collapsed (2) and crumbling (3) tiles.
- **World save:** `guestPiles` (co-op guests' Shardpiles by playerId); `pending.advanceToZone` (9 = The Landlord
  beaten in a friend's world).

## 4. Runtime entities (ECS-lite)

A single `World` holds typed arrays of components keyed by entity id (u16, recycled). Components:
`Transform {x,y,vx,vy,facing}`, `Body {radius, solid, team}`, `Health {hp, max, poise, poiseMax,
invulnUntil}`, `Stamina`, `Statuses {meters[5], active[5], controls[6] (end times)}`, `Player {playerId, input, dodgeReadyAt,
attackState, blockState, twoHanded, downed, reviveProgress, downs}`, `Enemy {defId, ai, elite?, cooldowns}`,
`Boss {phase}`, `Projectile`, `Telegraph {primitive, params, start, end, kind, ownerId}`, `Hazard`,
`Pickup {loot for playerId | shards}`, `Interactable {chest|mimic|bonfire|sign|stairs|gary|reliquary}`,
`Render {drawId, anim}`.

Systems run in a fixed order each 1/60 s tick: input → movement → statuses → AI → attacks/telegraphs →
projectiles → collisions/hits → damage/death → loot → room/wave logic → net snapshot. Rendering is
separate and reads the world with interpolation.

## 5. Settings

```ts
interface Settings {
  video: { scale: number; fullscreen: boolean; shake: number; hitstop: boolean; damageNumbers: boolean; highContrastTelegraphs: boolean; telegraphIconSize: 1 | 2 };
  audio: { master: number; sfx: number; music: number };
  controls: { keyboard: Record<Action, string[]>; gamepad: Record<Action, number[]>; aimAssist: number; holdToBlock: boolean };
  net: { name: string };
  game: { friendlyFire: number };   // co-op friendly fire %, 0–200 in steps of 10, default 100 (D115; older settings → 100)
}
```
