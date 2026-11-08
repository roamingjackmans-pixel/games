# Dungeon Joe — Procedural Generation

How zones, rooms, enemies and chests are generated today. Source: `src/game/procgen/*` (`zone.ts`, `rooms.ts`,
`templates.ts`, `shapes.ts`, `terrain.ts`, `mix.ts`, `waves.ts`, `elite.ts`, `chests.ts`, `bonusBoss.ts`), room
templates in `src/data/rooms/*`, wave spawning in `src/game/session.ts`. Decision ids point to `docs/DECISIONS.md`.

Contents: [1 Random numbers](#1-random-numbers) · [2 Zone layout](#2-zone-layout) · [3 Rooms](#3-rooms) ·
[4 Enemies and waves](#4-enemies-and-waves) · [5 Chests and mimics](#5-chests-and-mimics) · [6 New Game+](#6-new-game) ·
[7 Bonfires, zones, cycles](#7-bonfires-zone-transitions-and-cycles) · [8 Training Hall](#8-the-training-hall) ·
[9 Determinism and tests](#9-determinism-and-tests)

## 1. Random numbers

- PRNG: **xoshiro128\*\***, seeded through splitmix32 from a 32-bit FNV-1a hash of a string (`engine/rng.ts`).
- Every gameplay roll comes from a **named stream**, `stream(seed, label)`, so the host, every guest and a reload
  agree, and adding a roll to one stream never moves another. `Math.random()` is banned in `src/game` and `src/data`
  by a lint rule; it is allowed only in cosmetic client code (`engine/particles.ts`, `render/ambience.ts`).

| Stream label | Used for |
|---|---|
| `map:<zone>:<cycle>:<attempt>` | the zone grid and room kinds |
| `shapes:<zone>:<cycle>` | each combat room's shape family |
| `rooms:<zone>:<cycle>` | the zone's enemy mix |
| `shape:<zone>:<roomId>`, `props:<zone>:<roomId>` | a room's shape mask; prop thinning |
| `terrain:<zone>:<cycle>:<roomId>` | hazardous terrain |
| `waves:<zone>:<cycle>:<roomId>[:p<n>]` | a room's waves and Elite rolls (per party size) |
| `ngElite:<zone>:<cycle>:<roomId>[:p<n>]` | the guaranteed NG+ Elite (D296) |
| `bonusBoss:<zone>:<cycle>` | the NG+ bonus boss room and boss (D278) |
| `chest:<zone>:<cycle>:<roomId>` | a room's chest and mimic roll |
| `spawn:<zone>:<roomId>:<wave>:<deaths>` | spawn points for a wave |
| `loot:<playerId>:…` | drops, instanced per player (D33): enemies, chests, bosses, reliquaries, the Instructor |
| `shop:<bonfireId>:<cycle>:<rolls>`, `shopgem:<zone>:<cycle>`, `gary:<zone>:<cycle>` | shop and merchant stock |
| `<seed>\|combat` | the host's in-fight rolls (one stream per `World`) |

## 2. Zone layout

`generateZone(seed, zone, { cycle, tutorial, fewSpells })` → `ZoneLayout`. A **9 × 9 grid**; each cell is one room.

1. Room count `N = 12 + floor(zone / 2)` (12–16).
2. Grow from the centre (4,4), the **start room**: pick a frontier room and a random direction; skip cells off the
   grid or taken; never make a 2 × 2 block; a cell that would touch 2+ rooms is accepted only 70% of the time.
3. BFS distances from the start. The **farthest dead end** with a free neighbour becomes the **boss anteroom**
   (`z<zone>-boss`, a bonfire); the **boss room** (`z<zone>-bossroom`) goes in that free cell. If nothing fits, the
   attempt is redone with the next attempt number (up to 50).
4. Other dead ends, farthest first: a **treasure room** (always; a second 50%), a **spell reliquary** (35%; 100% from
   zone 3 when the character knows fewer than 2 spells), a **merchant room** (Gary, 20%, never zone 1). Dead ends left
   over are combat rooms with a guaranteed small chest (`bonusChest`).
5. Every other room is **combat**; each combat room is an **ambush** 10% of the time (doors lock on entry, its waves
   spring at once).
6. Each combat / ambush room gets a **shape family** from its zone's list, never the family of a neighbour while
   another is free.
7. The zone's enemy **mix** is drawn (§4).

Room ids: `z<zone>-start`, `z<zone>-boss` (anteroom), `z<zone>-bossroom`, `z<zone>-r<n>`, `z<zone>-tutorial`,
`z<zone>-trial`. The minimap shows visited rooms and icons for special rooms seen through a door.

## 3. Rooms

Every room is **40 × 22 tiles of 32 px** (1280 × 704). Walls ring the outside; doors are 2 tiles wide in the middle
of each side that has a neighbour. `buildRoom` turns a layout node into a `Room` (tiles, doors) and its markers
(spawns, chest spots, bonfire, boss spot, stairs, graves, pools, stations).

### 3.1 Templates and shapes

Each zone has **10 interior templates** (`src/data/rooms/<zone>.ts`), ASCII grids:

```
#  wall      .  floor      P  pillar (blocks movement and projectiles)
o  prop (blocks movement; enemy shots stop at it, D180)       ~  zone hazard tile (walkable, hurts or slows)
_  pit (cannot walk; falling in = 30% of max HP)               G  raised grate (Sewers: safe from waves)
S  enemy spawn point (≥ 200 px from any door)    C  chest spot    D  door
boss arenas: K boss spot, H stairs, g open grave (pit + summon spot), w pool, t breakable tree, V void
```

Rules (validated by a unit test): at least 60% floor; every door reaches every other door; spawn points ≥ 200 px from
doors; the gap rule: blocking things touch or leave at least 3 tiles (`MIN_GAP`, an Elite brute fits). Combat rooms
pick a template at random, mirrored horizontally / vertically at random; mirrored templates thin their props by 20%
(whole free-standing clumps).

**Shapes** (`shapes.ts`): a combat room's shape family carves its outline inward from the rectangle (cross halls,
caves, tunnels, clearings, stepped forges, naves, gears, void islands; per-zone lists) over the template, then a
repair pass removes obstacles crowding the new walls, closes slivers, fills enclosed pockets and re-places lost spawn
points and chest spots. Doors and door approaches never move. Shaped rooms may go down to 50% floor. A shape that
cannot be made valid leaves the plain template. Special rooms get their zone's frame.

Special rooms have fixed layouts (`data/rooms/special.ts`): start, anteroom (bonfire rooms), treasure, reliquary,
merchant, Training Hall, the Instructor's room; boss arenas are in `data/rooms/bosses.ts` and the boss data.

### 3.2 Hazardous terrain

A layer over plain floor (`Room.terrain`, `terrain.ts`), separate from `~` tiles. **50%** of combat and ambush rooms
roll it (D160). A normal terrain room gets **1–3 organic patches** (9–20 tiles, round blobs), each **Slow** or
**Hurt** (50/50), covering at most **8%** of the floor. **30%** of terrain rooms are **heavy**: 4–8 big patches up to
**30%** of the floor, all Slow, all Hurt, or mixed.

- Only on `.` floor whose 8 neighbours are floor or grate: never on or touching walls, pillars, props, pits, void,
  `~` tiles or doors. Never within 3 tiles of a door, never on or next to a spawn point, chest spot or the centre.
- Patches keep a 1-tile gap. After each patch a flood fill checks that a terrain-free route still joins every door,
  spawn point and chest spot; a patch that breaks one is dropped and another tried.
- Never in boss arenas, the Training Hall, the Instructor's room, bonfire rooms, treasure, reliquary or merchant rooms.
- The host sends it in the room sync (`RoomSync.terrain`, base64, only when present). Effects: GAME_DESIGN §5.1.

## 4. Enemies and waves

**Mix** (`mix.ts`, stream `rooms:`): each zone visit draws **5 of the zone's 10 types** (D241) with ≥ 1 melee role
(fodder, brute, assassin, tank), ≥ 1 non-melee role, ≥ 1 type with a Red attack and ≥ 1 with a Piercing attack.

**Threat budget** (`waves.ts`): `budget = (6 + 2 × depth) × (1 + 0.15 × (zone − 1))`, depth = BFS distance from the
start (at least 1), × **1.5** (`ROOM_ENEMY_MULT`, D79). Costs by role (`data/roles.ts`): fodder 2, swarm group 3,
ranged 3, caster 4, support 4, brute 6, assassin 4, tank 5, hazard 4.

- **Waves:** 1 at depth 1–2, 2 at 3–5, 3 at 6+, each worth an equal share of the budget. A wave holds at most 12
  enemies and at most 2 casters / supports and 2 brutes / tanks. Packs (`traits.packSize`) spawn together.
- **Co-op** (D159): every wave stays the solo size; the party adds **one full wave per extra player**. Each enemy's
  Shards and drop chances are divided by the plan's `share`, so every player earns the same per room. Bosses and
  Elites gain HP with the party (NETCODE §7); room enemies do not.
- **Spawning** (`session.ts`): the first wave on entry (an ambush springs all its solo waves at once with a 1.5 s
  tell); each next wave when the previous is 70% dead. Enemies appear at spawn points ≥ 200 px from every player
  with a 1.0 s rising-circle tell, invulnerable until they appear.
- **Elites** (`elite.ts`): 8% of non-swarm, non-special spawns solo, +4% per extra player (12 / 16 / 20%), at most 2
  per player per room. One of 8 affixes: frenzied, armored, vampiric, arcane, molten, frostbound, shielded, summoner.
- **Room clear:** no live enemies and no waves left → doors unlock. Shards are credited on each kill (`shardGain`).
  Dropped items stay on the floor; leaving the room stores them (`world.leftBehind`) and they are back on return.

## 5. Chests and mimics

- **Treasure room:** always one chest (`treasureChest`), guarded 30% of the time. **Reliquary:** the room's shrine.
- **Small chest** (D93): a combat / ambush room holds one 25% of the time (leftover dead ends always). It stands on
  its C spot (or the centre) from the moment you enter and can be opened any time; clearing a room spawns nothing.
- **Mimic:** every chest (not reliquaries, the tutorial or Gary's) is a mimic **8%** of the time (D105). A mimic sits
  dormant like a chest and does not count toward the room clear.
- Opened chests and killed mimics stay done (`chestsOpened`, `mimicsKilled`; awake mimics in `mimicsAwake`).
  Opening: hold Interact; loot is rolled and dropped per player (D33).

## 6. New Game+

From cycle 1 (NG+1) the same generators run with the cycle in every stream label, plus:

| Rule | What |
|---|---|
| **Zone 8 head counts** (D276) | every room is budgeted like a zone 8 room of its depth (`budgetZone`), priced in the zone's own mix, never below its own budget; the share grows with it, so Shards and loot per room stay the same |
| **An Elite in every room** (D296) | a room whose waves rolled none makes one eligible enemy (earliest wave) an Elite, or adds an Elite from the mix to wave 1 (`ensureNgElite`) |
| **Bonus boss room** (D278, D290) | one combat room per zone (`bonusBossFor`) holds a boss from any zone in its second phase instead of waves. Pool: every boss with a second phase that is not `arenaBound` (not the Bloatking, Ignatius or the Landlord). Its bar starts full at 30% of that boss's HP for the cycle; it hits like a boss of the room's zone; Shards ×0.3; a boss chest's loot; not counted as a boss kill |
| **Third boss phase** (D295) | zone 1–7 bosses spawn with a derived three-phase list (`boss/ngPhases.ts`) |
| Enemy scaling | HP, damage, item level and per-zone NG+ damage tables live in `combat/formulas.ts` and `data/roles.ts` (D209, D259, D275, D287); GAME_DESIGN covers the numbers |

## 7. Bonfires, zone transitions and cycles

- Bonfires: the start room and the boss anteroom, ids `z<zone>-start` / `z<zone>-boss`. Every rest heals and refills
  the Thermos (D150) and respawns the zone's enemies.
- Beating the boss opens stairs in the boss room; taking them generates the next zone and places the party at its
  start bonfire.
- After zone 8: credits, then a **Begin Cycle** bonfire (`ngplus` interactable). `beginNextCycle`: `cycle + 1`, a new
  seed `<first 12 chars of the seed>+<cycle>`, a fresh `WorldState` at zone 1, no tutorial; the character keeps
  everything.

## 8. The Training Hall

A new character's first zone (cycle 0, `tutorial`) adds the **Training Hall** (`z1-tutorial`) below the start room.
It has **11 stations** (`TUTORIAL_STATIONS`): move, aim, attack, block, parry, dodge a Red attack, step out of a
Piercing area, two-hand and swap, drink from the Thermos, Slow ground, Hurt ground. Stations do not gate the door.
The hall's east door opens on **the Instructor's room** (`z1-trial`, off the grid, D75, D90), whose east door leads to
the start room's south door. Nobody dies in the hall (D73); in the Instructor's room you can, and you wake at the start
of the hall.

## 9. Determinism and tests

- Generation is a pure function of (seed, zone, cycle, options) → `ZoneLayout`, and (layout, room) → `Room` +
  markers + `RoomPlan`. Host and guests generate the same map; the host still sends tiles and terrain in the room sync.
- Unit tests: many seeds generate every zone without errors; doors reachable; the boss room exists off the anteroom;
  the mix is valid for every zone; templates pass validation; wave caps hold; the mimic rate is 8% ± 0.6%; NG+ rooms
  hold zone 8's head counts and an Elite; the bonus boss pick is deterministic.
