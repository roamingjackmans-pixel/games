# Dungeon Joe — Data Model

How the game's data is shaped today: saves, items, the data tables, runtime entities and settings. The code is the
authority: `src/game/types.ts` (shared shapes), `src/game/world.ts` (runtime components), `src/game/save/*` (save
files), `src/engine/settings.ts` and `src/engine/padProfile.ts` (settings). This file summarises them and names the
rules that are easy to break. Decision ids in brackets point to `docs/DECISIONS.md`.

Contents: [1 Save file and storage](#1-save-file-and-storage) · [2 Items and gems](#2-items-and-gems) ·
[3 Data tables](#3-data-tables-srcdata) · [4 Runtime entities](#4-runtime-entities-ecs-lite) · [5 Settings](#5-settings)

## 1. Save file and storage

### 1.1 Storage

Everything lives in `localStorage` (or an in-memory fallback when storage is blocked, `getStore()`).

| Key | Holds | Code |
|---|---|---|
| `dj.save.<1–10>` | one `SaveFile` per slot | `game/save/storage.ts` |
| `dj.meta` | `{ lastSlot, version }` | `game/save/storage.ts` |
| `dj.settings` | `Settings` (§5); the **default** controller layout only (a character's own is in its save, D266) | `engine/settings.ts`, `engine/padProfile.ts` |
| `dj.achievements` | `{ v, unlocked: id → time, counters }`, account-wide | `game/achievements.ts` |
| `dj.stats` | account-wide Statistics counters `{ v, c }` | `game/stats.ts` |
| `dj.friends` | `{ v: 1, me, appearOnline, list: { code, name, added }[] }`: this browser's friend code and its friends (D339, max 30) | `game/save/friends.ts` |

Export / import: one save as a `<name>-slot<n>.dungeonjoe.json` file (`game/save/exportImport.ts`). Import migrates,
validates and refuses versions newer than the game.

### 1.2 The save file

`SAVE_VERSION = 3`. Loading always runs, in order: `migrate()` (version steps, then `untierSave`), `validateSave()`
(refuses a broken file), `normalizeSave()` (fills fields added since, clamps values). A field added later is
**optional or defaulted in `normalizeSave`**, so it needs no version bump; bump the version only when an old shape
must be rewritten, and add a `MIGRATIONS` entry in `save/migrations.ts`.

```ts
interface SaveFile {
  version: number; slot: number; createdAt: string; updatedAt: string;   // ISO times
  character: Character;
  world: WorldState;
  stats: SaveStats;
  pending?: { advanceToZone?: number; beatenZones?: number[] };   // co-op progress for the next Continue (D195)
}
```

### 1.3 Character

| Field | Notes |
|---|---|
| `playerId`, `name`, `classId` | `playerId` is stable: co-op identity, loot streams |
| `level`, `stats` | `stats`: `hp, endurance, bonk, slicey, brain, prayer` (Endurance was Stamina, D82) |
| `freePoints` | points refunded by a Tear of Undoing, spent free at a bonfire |
| `shards`, `glowen`, `tears` | currencies; Glowen was Stardust (D80) |
| `essence?` | Soul Essence held, tiers 1–5 as five counts (D198) |
| `flaskMax`, `flaskCur`, `bossesBeaten` | the Thermos |
| `highestZoneBeaten`, `cycle` | progress; `cycle` 0 = first playthrough, 1 = NG+1 … |
| `equipment` | `main, off, head, body, legs, ring1–ring4` (`Item \| null`; four rings since D228) |
| `altMain`, `altOff` | the second weapon and second off hand for the quick swap (D228) |
| `twoHanded` | |
| `bag` | items, max 60 (`BAG_SIZE`) |
| `gems` | loose gems |
| `consumables`, `quickSlot` | counts by `ConsumableId`; the quick-use pick |
| `knownSpells`, `spellLoadout` | `{ brain: Loadout3, prayer: Loadout3 }` |
| `tutorialDone` | |
| `appearance?` | the character creator's look (sanitised on load) |
| `proficiency?` | weapon-class experience by class (D178) |
| `bestiary?` | `{ kills: id → n, seen: id[] }` (D229) |
| `pad?` | this character's controller layout `{ gamepad, menuPad, aimAssist }` (D266); absent until it first plays, when it copies the default; normalised on load |

### 1.4 WorldState

| Field | Notes |
|---|---|
| `seed`, `zone`, `roomId`, `respawnBonfireId` | bonfire ids are `z<zone>-start` / `z<zone>-boss` |
| `bonfiresUsed`, `bonfiresUsedByPlayer`, `bonfiresDiscovered` | rests are tracked, but every rest heals and refills the Thermos (D150) |
| `roomsVisited`, `roomsCleared` | room ids `z<zone>-r<n>`, `z<zone>-start`, `z<zone>-boss` (anteroom), `z<zone>-bossroom` |
| `chestsOpened`, `mimicsKilled`, `mimicsAwake`, `reliquariesOpened` | chest ids `<roomId>-c0` |
| `bossesBeatenThisCycle`, `bossKilled`, `bossReliquary?`, `instructorKilled?` | |
| `garyGone`, `garyStock` | Gary's stock per merchant room: `GaryStockEntry { kind, item?, gem?, consumable?, count?, price, sold }` |
| `shopStock` | per bonfire id: `{ item, rolls?, sold? }` (the rotating piece) |
| `shardpile?`, `guestPiles?` | the dropped-Shards pile; co-op guests' piles by `playerId` |
| `leftBehind` | items left on the floor, by room: `{ playerId, item, x, y }[]` |
| `cutscenesSeen?` | story ids already played this cycle |

### 1.5 SaveStats

`deaths, kills, bossKills, playtimeSec, elitesKilled, mimicsKilled, mimicDeaths`, `instructorDeaths?` (D207), and
`extra?` (the per-character Statistics counters, numbers only).

### 1.6 Migrations

| Step | What |
|---|---|
| 0 → 1 | `leftBehind`, `altMain`, `freePoints`, `quickSlot`, visited / discovered lists |
| 1 → 2 | Stardust → Glowen, Stamina → Endurance, renamed items and affixes (D80, D82, D83) |
| 2 → 3 | a gem is a list of perks (`{family, tier}` → `{perks: [...]}`) |
| every load | `untierSave` (D284): a perk that still has an old tier folds it into its quality roll; tier-less perks are left alone |
| every load (`normalizeSave`) | `altOff`, `ring3`, `ring4` (D228), `essence` clamp, `plus` 0–15, duplicate item ids (D232), `pad`, `stats.extra`, `appearance` |

## 2. Items and gems

```ts
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type Slot = 'main' | 'off' | 'head' | 'body' | 'legs' | 'ring';
type ItemKind = 'weapon' | 'shield' | 'staff' | 'talisman' | 'armor' | 'ring';

interface Item {
  id: string; baseId: string; slot: Slot; kind: ItemKind;
  rarity: Rarity; ilvl: number; name: string;
  affixes: { id: string; value: number }[];
  sockets: (Gem | null)[];                 // length = socket count
  legendaryPower?: string;
  skills?: number;                         // weapon skills unlocked, rolled at drop (D89)
  bonusSkills?: number;                    // extra unlocked skills (the Instructor's drop)
  xp?: number;                             // proficiency bar toward the next rarity (D178)
  plus?: number;                           // reinforcement +0 … +15 (D198)
  raised?: number;                         // times raised a rarity (D239)
  setPerk?: string;                        // set perk id (D243)
  locked?: boolean;                        // Sell all keeps it (D265)
  variant?: string;                        // weapons: a scaling variant of its class, e.g. 'blessed' (D319)
}

interface GemPerk { family: GemFamily; level?: number /* 1–50, D197; absent = 14 */; q?: number /* −0.5 … +0.5 roll; absent = 0 */ }
interface Gem {
  perks: GemPerk[];                        // 1–3 perks (NG+ gems carry more), distinct families, all weapon or all armor
  locked?: boolean;                        // Sell all gems keeps it (D282)
  origin?: GemFamily[];                    // the original perks a fuse must keep one of (D286); absent = its current perks
}
```

- **Gems have no tiers** (D284): a perk's strength is its family's baseline × level multiplier (×0.25 at 1 … ×3 at
  50) × (1 + roll). Families: weapon `quicksilver, tempo, fleetfoot, brutal, ember, rime, storm, dawn, dusk, leech,
  vigor`; armor `bulwark, hearth, zephyr, gilt`. Weapon gems go in weapons, staffs and talismans; armor gems in armour
  and shields (D227). `isValidGem` / `untierGem` in `data/gems.ts` check and clean gems from saves and the network.
- **Either-hand items:** staffs, talismans and crossbows (`WeaponDef.eitherHand`, D291) go in all four weapon slots.
- Derived at runtime, never stored: base damage / defense from `baseId` + `ilvl` + rarity + `plus`, requirements,
  skills unlocked, everything in `Derived` (`game/player/derived.ts`). Item cards compute what an item would deal
  equipped by running `computeDerived` on a copy of the character (D294).

## 3. Data tables (`src/data`)

Content is data: systems read these tables and never special-case an id. `validateData()` (`data/validate.ts`,
run by `npm run validate:data` and the unit tests) checks them, including the Red / Piercing rules (no attack is both;
every Piercing area escapable).

| File | Table |
|---|---|
| `zones.ts` | `ZONES`: 8 `ZoneDef` (name, palette, enemies, boss, music, hazard tile, resist, status immunities, tagline) |
| `enemies/*.ts` | `ENEMIES`: 10 per zone (`ROSTER_SIZE`) plus specials (summons, Mimic, Gary, the Instructor, dummies) |
| `bosses/*.ts` | `BOSSES`: one per zone, plus their parts and arenas |
| `roles.ts` | role base stats and costs, Shard factors, per-zone and NG+ damage tables (D231, D275, D287) |
| `weapons.ts`, `skills.ts` | `WeaponDef` and their three skills each |
| `shields.ts`, `castingTools.ts`, `armor.ts`, `armorLooks.ts`, `rings.ts` | gear bases |
| `affixes.ts`, `gems.ts`, `legendaries.ts`, `setPerks.ts`, `proficiency.ts`, `essence.ts` | item modifiers and progression |
| `spells.ts`, `classes.ts` | 28 spells, 10 classes |
| `consumables.ts`, `lootTables.ts` | consumables and drop tables |
| `rooms/*.ts` | room templates per zone, special rooms, boss arenas |
| `story.ts`, `achievements.ts`, `bestiary.ts`, `appearance.ts` | text, achievements, the Bestiary, creator options |

### 3.1 Vocabulary

The shapes are in `src/game/types.ts`; the main ones:

- **Damage types** (D80): `physical, magic, void, fire, holy`. **Statuses** (meters): `burn, chill, shock, bleed,
  poison`. **Controls** (timed): `freeze, blind, hexed, silence, root, hold`. **Roles:** `fodder, swarm, ranged,
  caster, support, brute, assassin, tank, hazard` (+ `boss`).
- **`EnemyDef`:** `id, zone, name, role, mult?, radius, resist, element?, statusImmune?, moveStyle, speed?,
  preferredRange, attacks, extras?, onDeath?, swarm?, traits?, special?, phase2?` (a non-boss second phase, D107),
  plus art (`draw, palette?, hitSound?, flavor`) and tags (`undead?, construct?`). `traits` is the list of special
  behaviours (front guard, shell, stealth, blink, drift, contact damage, reflects projectiles, fixed HP, …).
- **`AttackDef`:** `kind` (`normal | red | pierce | utility`), `pattern?`, `effects?`, `windupMs, activeMs?,
  recoverMs`, `dmgMult, type, status?, control?, cooldownS, range, weight`, plus `budget, condition` (e.g.
  `cycleAtLeast(1)`, D277), `parryable / parryableHits`, `grab {holdS, mult}`, `move` (lunge, leap, charge with
  `charges`, bounces, wall stops), combos (`comboMults`, `comboRotateDeg`), `chain` (an attack started when this one
  ends), `gazeTurnDeg`, `body: 'split'`, triggers for passive and on-death utilities.
- **`PatternDef`** (the attack shapes, GAME_DESIGN §5.7): `melee, projectile, circle, ring, line, cone, lanes, grid,
  sweep, expandingRing, randomCircles, wave, pockets, trail, beam, sequence`. Anchors: `self, target,
  targetPast(1.0), point, wall, corner, eachPlayer, aim, center, eachPlayerPast(1.0)`. Any pattern may add `persist`
  (a hazard left behind), `pullSpeed`, `parryable`, `delayS` (extra telegraph time) and `vfx` (its look).
  **Escape reach** (`escapeReach`): a player can cover `(telegraph − 0.1 s) × (walk speed − pullSpeed) − 40` px before
  impact. The escapability test checks every Piercing area against it, and **pockets** are placed so each player has
  one within that reach (one on the anchor first, if given).
- **`EffectDef`:** the closed vocabulary shared by skills, spells, consumables, legendary powers, elite affixes and
  enemy utilities: `damage, dash, teleport, buff, debuff, heal, barrier, summon, decoy, pull, push, zone, wall, stance,
  channel, chain, modifyNext, link, cleanse, reviveValue, stagger, resetCooldown, resource, hyperArmor, reveal,
  hazard, onKill/onHit/onBlock/onParry/onDodge/everyNthHit, sequence, repeat, invuln, charge, taunt, split,
  resurrect, mirror, roomMod, pulseHazards, scatter, eliteSummon, steal, die, collapseFloor`. Optional `target`, `r`,
  `delayS` on any.
- **`BossDef`** = `EnemyDef` minus `attacks`, with `phases: BossPhase[]`, `arenaId`, `introTitle`, `introSub`,
  `baseHp?`, `firstCycleHpMult?` (D211), `arenaBound?` (never an NG+ bonus boss, D278), `music`.
- **`BossPhase`:** `untilHpPct, attacks, speedMult, dmgMult`, and optionally `cooldownMult` (D295), `arena`
  changes (tiles, hazards, darkness, flooding, moving floors: `ArenaChange`), `summons`, `name`, `barName`,
  `refillHp`, `barMult` (the bar as a share of full HP, D289), `hpOfPrevPhase` (D279), `transitionS`,
  `transitionBeats`, `clearField`, and `passive` (pull, split body, stationary spot, scale, projectile speed,
  `formAtStart`, `preferredRange`, `blink`). In NG+ zone 1–7 bosses spawn with a derived three-phase list
  (`ngBossDef`, D295).
- **`WeaponDef`:** `grades` (E–S on purpose, D40), `req`, `speedClass`, `combo: SwingDef[]`, `base1, stamina,
  poiseDmg, reviveValue`, `skills` (three), `weight`, and optionally `ranged` (speed, charge, volley, D205),
  `twoHandOnly` (bows), `eitherHand` (crossbows, D291), `element` (hybrids), `holyPct`, `bleed`, `hyperArmor`,
  backstab / riposte multipliers, `legendaryNames`; `ranged.drawId` / `ranged.sfx` name its shot's look and sound.
  A **`SwingDef`** has windup / active / recovery ms, `mult`, `step` and a `hitbox`: `arc` (a 360° arc is a spin),
  `thrust`, `circle` (an overhead's landing `d` px ahead) or `proj` (`returns` and `range` for a thrown ring), plus a
  `move` for its animation (`slash, backslash, thrust, spin, overhead, lash, lashSweep, throw`; D320).
  **Scaling variants** (`data/weaponVariants.ts`, D319) lay other grades and a damage type over a class; anything that
  reads a weapon item's grades, requirements or element goes through `weaponOf(item)` (`game/items/weaponOf.ts`).
- **`SpellDef`** (`school, req, castS, cooldownS, stamina, effect, aimed?, element?, weaponBuff?`), **`SkillDef`**,
  **`ShieldDef`**, **`CastingToolDef`**, **`ArmorSetDef`**, **`RingDef`**, **`ClassId`** (10 classes).

## 4. Runtime entities (ECS-lite)

A `World` (`game/world.ts`) holds entities as plain objects in a `Map<id, Entity>`: shared fields plus optional
components. Ids are numbers, recycled after removal (ids up to 64 are never reused); snapshots carry them as u16.
The world owns `time`, `tick`, the `combat` stream, the current `Room`, `roomMods` (flood, darkness, enrage, late fee),
an `events` queue the client reads for sound and effects, and scheduled callbacks. No DOM, canvas or audio.

| Field / component | Holds |
|---|---|
| core | `id, type, x, y, px, py` (previous position, for interpolation), `vx, vy, facing, radius, team, solid, flying, removed, born, hitstopUntil, forced` (dash / knock / pull / leap / slide), `drawId`, `anim` |
| `type` | `player, enemy, projectile, telegraph, hazard, pickup, interact, decoy, wall, corpse` |
| `hp` (`HealthC`) | `hp, max, poise, poiseMax, barrier, invulnUntil, staggerUntil, riposteUntil, dead, last hit` |
| `stam` | `{ cur, max }` |
| `st` (`StatusC`) | status `meters`, `active` end times, `controls` end times, immunities |
| `buffs` | timed buffs with stacks |
| `pl` (`PlayerC`) | the character and its `derived` stats, input, state machine (`idle, attack, dodge, skill, cast, flask, stagger, held, falling, consumable, channel, charge, dashing`), `combo` (`ComboState`; `offHand` marks an off-hand shot, D291), action / channel / charge runs, dodge and parry timers, revive (`downed`, ghost, progress), grab hold, the stun rule state (`stunImmuneUntil, stunChain, stunChainUntil`, D293), pending loot |
| `en` (`EnemyC`) | def, `isBoss`, `elite`, AI state, cooldowns, `attack` (`AttackRun`, incl. the fitted charge bar `lane`, D272), aggro, `dmgMult`, phase and transition, summons, `hpScaleBase` and `barMult` (party rescale keeps the bar share, D289), `bonusBoss` (D278), drop info |
| `pr` (`ProjC`) | owner, team, damage, statuses, control, kind, speed, homing, pierce, `hit`, `volleyHit` (D264), lob, returning, falloff (D88), impact effect |
| `tg` (`TeleC`) | `shapes`, `kind`, `start` (later for a two-set pattern's second set, D261), `impact`, `end`, `mode` (`instant, once, tick`), pulses, follow / track, `rehitUntil` (sweeps, D273), `area`, `spec`, persist |
| `hz` (`HazardC`) | hazard id, shapes, team, ticks, spec, effects, slow, pull, blocks projectiles / enemies |
| `pk` (`PickupC`) | `item, shards, gem, consumable, shardpile, glowen, spell, tear, essence`; `forPlayer` (instanced loot, D33) |
| `it` (`InteractC`) | `chest, mimic, bonfire, sign, stairs, gary, reliquary, door, station, shardpile, ngplus` |
| `dc`, `wl` | decoys, spell walls |

**Tick order** (`game/sim.ts`, 1/60 s): players → movement → statuses → enemies (AI and attacks) → telegraphs →
projectiles → hazards → terrain → scheduled callbacks → the session's room and wave logic (`hooks.onTick`) → dead
enemies removed → expired decoys, walls and pickups removed → sweep. Rendering is separate and interpolates between
`px, py` and `x, y`.

## 5. Settings

```ts
interface Settings {
  video: { scale; fullSharpness; fullscreen; shake; hitstop; damageNumbers; highContrastTelegraphs;
           telegraphIconSize: 1 | 2; frameCap: 0 | 30 | 60 | 120; showFps };
  audio: { master; sfx; music };
  controls: {
    keyboard: KeyboardBindings; gamepad: GamepadBindings; menuPad: MenuPadBindings; aimAssist: number;
    holdToBlock: boolean; prompts: 'auto' | 'keyboard' | 'xbox' | 'playstation';
    touch: { mode: 'auto' | 'on' | 'off'; size; opacity };   // D143
  };
  net: { name: string };
  game: { friendlyFire: number };   // 0–200 in steps of 10, default 100 (D115)
}
```

`normalizeSettings` merges anything read over the defaults. **Per-character controller layouts** (D266): `gamepad`,
`menuPad` and `aimAssist` form a `PadLayout`. While a character plays, its `pad` is swapped into the live settings
(`usePadOf`) and edits are copied back to the character; `dj.settings` only ever stores the default layout
(`diskSettings`). Keyboard keys, prompts, hold / toggle block and touch settings stay global.
