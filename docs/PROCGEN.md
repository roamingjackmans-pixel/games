# Dungeon Joe — Procedural Generation

Source for `src/game/procgen/*`. Everything here is deterministic from the playthrough **seed** so the
save file stores only the seed plus state deltas, and the host and guests agree on the world.

## 1. Random numbers

- PRNG: **xoshiro128\*\*** (or mulberry32 if simpler), seeded from a 32-bit hash of the seed string.
- Named streams derived from the seed with a label hash: `map:<zone>`, `rooms:<zone>`, `waves:<zone>:<room>`,
  `loot:<playerId>:<counter>`, `combat` (host only, per tick), `cosmetic` (local, never affects state).
- Never use `Math.random()` in `src/game`; a lint rule forbids it (allowed only in `src/engine/fx`).

## 2. Zone layout

Grid of **9 × 9 cells**; each cell is one room. Rooms are all the same size: **40 × 22 tiles of 32 px**
(1280 × 704, with the HUD overlaying the top 16 px of margin); walls are the outer 1-tile ring; doors are
2 tiles wide in the middle of each side.

Algorithm (Isaac-style growth):

1. Target room count `N = 12 + floor(zone / 2)` (12–16) plus specials.
2. Place the **start room** at the center (4,4). Push it into a frontier list.
3. While rooms < N: pop a random frontier room, pick a random free orthogonal neighbor cell, accept it
   with probability 0.7 if it would have ≥ 2 room-neighbors (keep the map branchy) else 1.0; add it.
   Reject neighbors that would create a 2×2 block of rooms (keeps corridors legible).
4. Compute distances from the start (BFS). The **farthest dead end** becomes the **boss anteroom**; the
   boss room is placed in a free neighbor cell of it (if none, pick the next farthest dead end; if the
   whole map fails, re-roll with the next sub-seed). Anteroom gets a bonfire.
5. Other dead ends, farthest first: **treasure room** (always 1; a second at 50%), **spell reliquary**
   (35% per zone; 100% if the character knows fewer than 2 spells by zone 3), **merchant room** (20%, never
   zone 1), remaining dead ends are combat rooms with a small-chest bonus.
6. All other rooms are **combat rooms**. 10% of combat rooms are **ambush rooms** (doors lock and a wave
   spawns the moment you enter, no safe second).
7. The tutorial hall (new character, cycle 0) is a fixed extra room attached to the start room's south
   door; the start room's bonfire is lit only after leaving the hall.

The minimap shows discovered rooms; special rooms get an icon once seen through a door (treasure chest,
reliquary, merchant, bonfire, boss skull).

## 3. Room interiors

Each zone has **10 interior templates** (`src/data/rooms/<zone>.ts`), hand-authored ASCII grids:

```
#  wall      .  floor      P  pillar (blocks movement and projectiles)
o  prop (blocks movement, not projectiles: coffin, crate, mushroom)
~  hazard tile (zone-specific: water in Sewers, lava channel in Forge, ice in Reliquary)
_  pit (cannot walk; falling in = 30% of max HP, cannot be dodged, then respawn at the nearest edge)
G  raised grate (Sewers: safe from waves)   S  enemy spawn point   C  chest spot   D  door
```

Rules: at least 60% floor; every door reachable from every other door (flood fill test); spawn points
≥ 200 px from any door; a template is mirrored horizontally/vertically at random for variety; props are
randomly thinned by 20%. Hazard tiles are drawn under entities. Templates are validated by a unit test.

Special rooms have their own fixed layouts: treasure (a dais with the chest, 2 pillars), reliquary (a
shrine, candles, no enemies), merchant (Gary's cart, a rug), bonfire rooms (the camp stove, no
hazards), boss arenas (one per boss, CONTENT_ENEMIES §11).

### 3.2 Hazardous terrain

A layer over plain floor (`Room.terrain`, `procgen/terrain.ts`), separate from the template's `~` tiles.
**35%** of combat and ambush rooms roll it from their own stream `terrain:<zone>:<cycle>:<room>` (about 33% end
up with some: a cramped room may have no room for it). Such a room gets **1–3 organic patches** (9–20 tiles
each, grown as round blobs from a random seed tile), each patch **Slow** or **Hurt** (50/50).

- Only on `.` floor whose 8 neighbours are floor or grate: never on or touching walls, pillars, props, pits,
  void, `~` tiles or doors, so a patch never narrows a passage. Never within 3 tiles of a door, never on or next to
  a spawn point, a chest spot or the room's centre (where a chest without a C spot stands).
- Patches keep a 1-tile gap from each other; total coverage **≤ 8%** of the room's floor (average about 5%).
- After each patch, a flood fill checks that a **terrain-free walkable route** still joins every open door,
  spawn point and chest spot; a patch that breaks one is dropped and another seed tried.
- Never in boss arenas, the Training Hall, the Instructor's room, start/anteroom bonfire rooms, treasure,
  reliquary or merchant rooms.
- Deterministic; the host also sends it in the room sync (`RoomSync.terrain`, base64, only when present).
  Effects and look: GAME_DESIGN §5.1, ART_AUDIO-style themes in `src/render/terrain.ts`.

## 4. Enemy mix and waves

**Mix picker** (per zone, from `rooms:<zone>` stream): choose 5 of the zone's 10 types (D241; was 4 of 8) such that the set has
≥ 1 melee role (fodder, brute, tank, assassin), ≥ 1 non-melee role (ranged, caster, support, hazard,
swarm), ≥ 1 type with a Red special, ≥ 1 with a Piercing special (role enum per GAME_DESIGN §6.1). Re-draw until valid (tested to always terminate). The mix
is shown on the zone's title card ("Mossy Crypt — Shamblers, Bone Archers, Ghoul Leapers, Plague Bells").

**Threat budget** per combat room: `budget = (6 + 2 × depth) × (1 + 0.15 × (zone − 1))` where depth is
the BFS distance from the start. Enemy costs by role enum: fodder 2, swarm (one group) 3, ranged 3,
caster 4, support 4, brute 6, assassin 4, tank 5, hazard 4. Waves: split the budget into 1–3 waves (depth 1–2: one wave;
3–5: two; 6+: three), each wave spawning when the previous is 70% dead. Casters/support never exceed 2
per wave per player; brutes/tanks never exceed 2 per wave per player; a wave holds at most 12 enemies per player
and a room 18 live enemies per player.

**Room size and the party (D79):** the budget above is multiplied by **1.5 × players**: a room has 50% more
enemies than the original budget, and 2, 3 and 4 players face 2×, 3× and 4× that (5 → 10 → 15 → 20). Room
enemies do not gain HP for the party (bosses do). Each room enemy's Shards and per-player drop chances are
divided by the same 1.5 × players, so what each player earns per room is unchanged; an Elite's drop chance is
divided only by the party size.

**Spawning**: each enemy appears at a spawn point ≥ 200 px from all players with a 1.0 s floor tell
(a rising circle) and is invulnerable until it appears. **Elite** roll 8% per non-swarm spawn solo, 12% / 16% /
20% with 2 / 3 / 4 players (D79), at most 2 Elites per player per room. Ambush rooms spawn all waves at once with a 1.5 s tell.

**Room clear**: no live enemies and no pending waves → doors unlock (no chest appears: a room's chest, if it
has one, was standing there from the start, §5), Shards and loot already dropped stay for 60 s then are auto-collected to the nearest
player's bag (Shards) or stay on the floor until the room is left (items are listed in the map's room
tooltip as "left behind: 2").

## 5. Chests and mimics

- Treasure-room chest: always. Reliquary: the room's purpose.
- **Small chest (D93)**: rolled per combat/ambush room from the room's stream with the zone (25%; the dead ends
  left over after the special rooms always get one). A room with a chest has it standing on its C spot (the
  room's centre if the template has none) from the moment you walk in, fight or not, and it can be opened at
  any time; a room without one never gets one. Clearing a room spawns nothing. Opened chests and killed
  mimics stay done (`chestsOpened`, `mimicsKilled`).
- **Mimic**: every chest (not reliquary, not tutorial, not Gary's) rolls 5% from the room stream; a mimic
  chest sits dormant in its room from entry like any chest and does not count toward the room clear. A mimic uses the same entity id scheme so the host and guests agree. Visual tells in
  GAME_DESIGN §6.5.
- Opening: hold Interact 0.6 s; loot bursts out (instanced per player, D33).

## 6. Bonfires

Start room and boss anteroom. Each has a stable id `z<zone>-start` / `z<zone>-boss`. The save tracks
`bonfiresUsed` (first-rest rule, D38) and the current respawn bonfire.

## 7. Zone transitions and NG+

Beating the boss opens stairs in the boss room. Taking them: zone title card, generate the next zone
from `map:<zone+1>` lazily, place the party at its start bonfire (fresh). After zone 8: credits, then
"Begin Cycle N+1" at a special bonfire: new seed = hash(seed, cycle + 1), zone 1, no tutorial.

## 8. Tutorial hall layout

Fixed 40 × 22 room: a corridor of **9 stations** left to right (signs with a short line each and a glowing
floor marker that completes when the action is performed): move · aim · attack a dummy · block a dummy's
swing · parry it · dodge a dummy's **Red** stomp · step out of a dummy's **Piercing** ring · two-hand ·
drink the flask (a dummy hits you once for 10%). Stations do not gate the door. The Instructor has his own room through
the hall's south door (D75): an optional side room off the grid, linked back to the hall (CONTENT_ENEMIES §10).
Nobody can die in the hall itself (D73); in his room you can, and you wake at the start of the hall.

## 9. Determinism and tests

- Generation is a pure function of (seed, zone) → `ZoneLayout`, and (seed, zone, roomId) → `RoomSpec`.
- Tests: 1,000 random seeds generate every zone with no exceptions; every room has reachable doors; the
  boss room exists and is a dead end; the mix picker returns a valid mix for every zone; thread budget
  results never exceed 12 live enemies; mimic rate over 10,000 chests is 5% ± 0.5%.
