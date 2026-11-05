# Dungeon Joe — Game Design Document

> Joe went down the stairs to find the fuse box. The stairs kept going.

A souls-like action RPG with the pace of Hades, the room-to-room rhythm of The Binding of Isaac, and the
loot of Diablo 3. Top-down arenas, procedurally generated zones, cooldown skills on every weapon, spells on
staffs and talismans, bonfires, a flask, red attacks you cannot block and blue attacks you cannot dodge,
mimics, gems, New Game+, ten classes, ten save files, and four-player online co-op in the browser.

All numbers in this document are **starting values**. The build tunes them, but keeps the *relationships*
(what is faster, what is stronger, what counters what). Decisions and their reasons are in
[DECISIONS.md](DECISIONS.md). Content lives in [CONTENT_ENEMIES.md](CONTENT_ENEMIES.md),
[CONTENT_ITEMS.md](CONTENT_ITEMS.md) and [CONTENT_SPELLS_CLASSES.md](CONTENT_SPELLS_CLASSES.md).

---

## 1. Pillars

1. **Every hit is a decision.** Stamina, a 5-second dodge, and telegraphed attacks mean you commit. Button
   mashing dies in zone 1.
2. **Readable danger.** Every attack has a telegraph you can learn. Red means *don't block*. Blue means
   *don't be there*. Nothing is both.
3. **The floor is lava, often.** Enemies and bosses paint the arena: lines, rings, grids, sweeps, zones.
   Positioning matters as much as timing, solo or with four people.
4. **Loot you feel.** A new weapon changes your verbs (skills), your rhythm (gems), and your build (stats).
5. **Grim place, dry voice.** The dungeon is deadly serious. The item descriptions are not.

## 2. The run

### 2.1 Structure

A **playthrough** = one character, one map seed, one NG+ cycle. It is 8 zones in order:

| # | Zone | Theme | Palette | Boss |
|---|---|---|---|---|
| 1 | Mossy Crypt | undead, moss, bone | moss green, bone white, grey | The Caretaker |
| 2 | Fungal Caverns | beasts, spores, glow | violet, teal glow, brown | Mother Spore |
| 3 | Drowned Sewers | drowned, slimes, rats | murky green, rust, black water | The Bloatking |
| 4 | Hollow Forest | fey, wolves, treants | autumn orange, deep green, gold | Vexthorn, the Hollow Stag |
| 5 | Ashen Forge | fire cult, constructs | red, black, ember orange | Foreman Ignatius |
| 6 | Frozen Reliquary | frost knights, wraiths, choir | ice blue, white, gold | Saint Aurelia the Unthawed |
| 7 | Clockwork Citadel | automata, magisters | brass, teal, violet | Archmagister Tock |
| 8 | The Abyss (final) | void horrors, hollow Joes | black, violet, white | The Landlord (3 phases) |

Each zone is a procedurally generated graph of **rooms** (12–16 ordinary rooms plus the special rooms
below, so 15–21 in all, see [PROCGEN.md](PROCGEN.md)):

- **Start room** with a **bonfire**.
- Combat rooms: the room locks when you enter, 1–3 **waves** spawn from the zone's enemy mix, doors open
  when the room is clear. Cleared rooms stay clear until you rest at a bonfire.
- **Treasure room** (1–2): a chest, sometimes guarded.
- **Spell reliquary** (rare): a special chest that holds a spell.
- **Merchant room** (rare): the wandering merchant.
- **Boss anteroom** with a **bonfire**, then the **boss room**. Beating the boss opens the stairs down.

Zone **enemy mix**: when a zone is generated it picks **4 of the zone's 8 enemy types**; every room in that
zone draws from those 4 (plus Elite variants). The mix must contain at least one melee type, one
non-melee type, one type with a Red special and one with a Piercing special.

### 2.2 Tutorial hall (new characters only, not in NG+)

The very first room is a training hall: sign posts teach move, aim, attack, block, parry (a dummy that
swings on a timer), dodge through a **red** attack, step out of a **blue** attack, two-hand, drink the
flask. You cannot die in the hall (D73). Through its south door, in **his own room**, waits **The Instructor**
(see CONTENT_ENEMIES §10, D75): 120,000 HP, regenerates, slow, hits like a truck; there you can die, and you wake
at the start of the hall. He is optional: the hall's exit to the first bonfire is its east door. If you somehow kill
it, it drops a random *really good* item: a Legendary weapon with all 3 skills unlocked at zone-3 item
level, or a random spell. The hall is not skippable, but it is short (under two minutes to walk through).

### 2.3 Scaling

Let `z` be the zone number (1–8), `c` the NG+ cycle (0 for the first playthrough), `p` the number of
players.

```
curve(z, c, k) = 1 + k (z−1)                                        when c = 0
               = (1.05 + 0.30 (z−1)/7) × (1 + 7k) × 1.1^(c−1)        when c ≥ 1   (D209)
enemyHP     = baseHP  × curve(z, c, 0.55) × co-op (D159)
enemyDamage = baseDmg × curve(z, c, 0.35)
enemyShards = baseShards × curve(z, c, 1.1)          (per player, instanced)
itemLevel   = z + c  (clamped to the item-level table, CONTENT_ITEMS §2)
```

New Game+ (D209): its zone 1 is 5% harder than the first playthrough's zone 8, rising evenly to 35% harder by its
zone 8; every cycle after that is 10% harder on every zone.

Expected character level at zone end (solo, first cycle): 12 · 22 · 32 · 42 · 52 · 62 · 72 · 80.
**Tuning target:** clearing every room of a zone once (no deaths, no Elites counted, no chests) yields
100% ± 20% of the Shards needed to go from the zone's expected entry level to its expected exit level
using the §3.3 cost curve and CONTENT_ENEMIES §1 Shard values. A unit test computes the expected yield
from the PROCGEN threat budgets and the role costs and fails outside the band. If it fails, retune the
**Shard values** (not the curve) and record "(tuned)". (tuned: a per-zone Shard factor, D51)

## 3. Stats

Six stats, 1–99 each. Level 1 characters have 48 points total (class tables in
CONTENT_SPELLS_CLASSES §3). Each level adds one point to one stat. Level = 1 + points bought.

| Stat | Governs |
|---|---|
| **HP** | Max health. |
| **Stamina** | Max stamina and regen. |
| **Bonk** | Damage of slow, heavy weapons (and crossbows, greatshields' requirements). |
| **Slicey** | Damage of fast, light weapons (and bows). |
| **Brain** | Offensive magic (staff spells). |
| **Prayer** | Healing and buff magic (talisman spells); slightly better flask. |

Scaling grades are deliberately spread: a weapon's main stat can scale anywhere from **E to S**, with
or without a second stat, and medium-speed hybrids scale with both anywhere from "a little" (D) to a
real split (A/C or B/B). Weapons with poor scaling have higher base damage (CONTENT_ITEMS §4).

### 3.1 Formulas

```
maxHP      = 100 + Σ per HP point:      pts 1–30: +14 · 31–60: +8  · 61–99: +3
maxStamina = 70  + Σ per Stamina point: pts 1–30: +3.5 · 31–60: +2 · 61–99: +0.8
staminaRegen (per second) = 22 + 0.25 × Stamina, after a 0.6 s delay following any spend;
                            paused while blocking a hit and during attack active frames.

scaling curve  f(s) = 1 − 0.982^s        (f(10)=.17 f(20)=.30 f(40)=.52 f(60)=.66 f(80)=.77 f(99)=.83)
grade multipliers: S 1.2 · A 1.0 · B 0.75 · C 0.5 · D 0.25 · E 0.1 · – 0

weaponDamage = base × (1 + Σ_stat grade(stat) × f(effStat)) × attackMultiplier × gear/gem/affix mods
   effStat = min(99, Bonk × 1.5) for Bonk while two-handing, otherwise the stat as it is (D72)
spellPower   = spellBase × (1 + 1.2 × f(Brain))  × toolMult        (Brain spells)
healPower    = spellBase × (1 + 1.0 × f(Prayer)) × toolMult        (Prayer spells)
   toolMult  = toolGrade × (1 + 0.35 × (toolIlvl − 1))   (CONTENT_ITEMS §6; spells have no other level scaling)
flaskHeal    = 40% maxHP × (1 + 0.003 × Prayer)
damageTaken  = incoming × 100 / (100 + Def[type]) × status/affix mods
```

### 3.2 Requirements (D37)

Every weapon, shield and casting tool lists minimum stats. Two-handing counts Bonk at ×1.5 toward
requirements (D72).

- Weapon below requirement: swings at **40% damage**, **skills locked**, a red "!" on the slot.
- Shield below requirement: guards at **half** its block values, cannot parry.
- Staff / talisman below requirement: **cannot cast**.
- Spell below its own Brain/Prayer requirement: cannot be slotted (greyed with the number needed).

### 3.3 Leveling

Enemies drop **Shards** (the soul currency). Spend them at a bonfire. Cost to go from level `L` to
`L + 1` (L is your current level):

```
cost(L) = floor((60 × 1.045^L + 15 L) × early(L)), early(L) = 1 + 0.6 × max(0, (21 − L) / 20)   L=1:124 · L=10:323 · L=20:458 · L=21:466 · L=30:674 · L=50:1291 · L=80:3229 (exact floor values; the first twenty levels cost up to 60% more, D147)
```

Whole-run totals: level 1→12 ≈ 2,100 · 12→22 ≈ 3,800 · 32→42 ≈ 8,100 · 52→62 ≈ 15,600 · 72→80 ≈ 21,000.

Death drops all unspent Shards as a glowing **Shardpile** where you died (D3). Touch it to recover. Die
again before recovering and it is gone. In a boss room the pile appears just inside the boss door.

**Respec:** a **Tear of Undoing** (boss drop 10%, spell reliquaries 5%, wandering merchant sometimes)
resets all stats to the class base and refunds the points, used at a bonfire.

## 4. Controls

Defaults (rebindable). Keyboard + mouse is the "host" layout; gamepad maps everything.

| Action | Keyboard / mouse | Gamepad (Xbox names) |
|---|---|---|
| Move | WASD | Left stick |
| Aim | Mouse cursor | Right stick (aim assist, §5.1) |
| Attack (light combo) | Left click | RT |
| Block / parry (shield or two-handed guard) | Right click (hold / tap) | LT |
| Dodge | Space | A |
| Weapon skill 1 / 2 / 3 | Q / E / R | LB / RB / Y |
| Spell 1 / 2 / 3 | 1 / 2 / 3 | D-pad left / up / right |
| Flask | C | X |
| Throwable (quick-use) | G | D-pad down |
| Interact (chest, bonfire, door, sign, pickup) | F | B |
| Two-hand toggle | Shift (tap) | Right stick click |
| Inventory / character | Tab | Back (View) |
| Map | M | Hold Back |
| Pause / menu | Esc or P | Start |
| Debug menu | Ctrl+Shift+D (then the owner code) | — |

Gamepad right-stick aim: the character faces the stick direction; when the stick is neutral, melee
attacks go toward the nearest enemy within 160 px of the facing cone, otherwise forward.

## 5. Combat

### 5.1 Movement and aiming

- Logical arena 1280 × 720 px. Player walk speed 260 px/s (modified by Chill, Haste, class perks).
- Twin-stick. Melee swings are centered on the aim direction. Projectiles and spells go to the cursor.
- Aim assist (gamepad): within ±14° of an enemy the aim snaps to it for projectiles.
- **Hazardous terrain** (PROCGEN §3.2): about a third of combat rooms have 1–3 patches on open floor, themed per
  zone and outlined so they never read as plain floor.
  - **Slow** (heavy and gooey: grave mud with bones, spore sludge, sewage slime, bramble roots, cooling slag, snow
    drifts, clockwork grease with gears, void tar): **−35% walking speed** while your centre is on it, players and
    walking enemies alike (fliers skim over it; bosses never meet it). One multiplier, never stacked. The **dodge
    is untouched**: it is forced motion and keeps its full distance and speed through the patch (so are leaps,
    dashes and knockbacks).
  - **Hurt** (flickering danger: ghostly grave-fire, acid, toxic bubbling, thorns, ember cracks, frost spikes,
    sparking plates, void crackle): players standing in it take **3% of max HP every 0.5 s** (a steady beat; the
    first hit lands on entry), with a hit flash and a soft hit sound. A dodge's i-frames skip a tick, so rolling
    across a patch is free. Enemies take nothing (it is their dungeon) and path straight through.

### 5.2 Attacks

Each **weapon class** defines a light-attack **combo** (2–4 swings). Each swing has `windup`, `active`,
`recovery` (ms), a stamina cost, a forward step, a hitbox (arc, thrust, line, or projectile) and a damage
multiplier. Holding attack continues the combo; the last swing has a longer recovery. Attack speed mods
(gems, affixes, Haste) scale windup/active/recovery together, capped at ×1.6 faster.

Heavy weapons have **hyper armor** on their active frames (you cannot be staggered by light hits while
swinging). Fast weapons do not.

**Hitstop**: 40 ms (light) to 90 ms (heavy) freeze on hit, plus screen shake scaled by damage. Enemies
flash white on hit, show floating damage numbers (colored by damage type), and a **stagger** when their
poise breaks (see §6.3).

### 5.3 Dodge

- Tap: 0.45 s dash, 220 px, i-frames from 0.05 s to 0.40 s. Costs 10 stamina.
- **One charge, 5.0 s recharge** (V Rising). A ring around the character shows the recharge. The Fleet
  affix (0.3–0.6 s per item), the Fleet Ring (0.5 s), Fleetfoot gems and Timekeeper shorten it; all
  reductions add up with a **floor of 3.0 s**. Chill adds 1.5 s to the current recharge.
- I-frames do **not** work against Piercing (blue) attacks (§5.6).

### 5.4 Block, parry, two-handing

**Shields** (off-hand) block while holding the block button:

| Shield type | Physical reduction | Elemental reduction | Stability (stamina per 100 dmg blocked) | Parry |
|---|---|---|---|---|
| Buckler | 60–70% | 20–30% | 45 | yes, 0.18 s window |
| Medium (kite, round) | 80–90% | 35–50% | 30 | yes, 0.12 s window |
| Greatshield | 100% | 55–65% | 18 | no |

Exact values per shield in CONTENT_ITEMS §5. Blocking a hit spends stamina; at 0 stamina you are **guard
broken** (1.5 s stagger, ×1.5 damage taken).

**Parry**: tapping block starts the parry window (a property of the shield, CONTENT_ITEMS §5). A hit
inside it is parried if the attack is **parryable**: every `normal`-kind melee attack and every enemy
projectile is parryable unless its table row says *unparryable*; **Red** attacks cannot be parried
(they guard-break); **Piercing** attacks cannot be parried either (blocking them works at normal
values). A parried melee attacker is **riposte-staggered** for 2 s and your next light hit on them deals
×3; a parried projectile is reflected back along its path with the same damage. Bosses can be parried
only on attacks marked *parryable* in their tables, and a boss needs two parries within 6 s to stagger
("Souls boss parry").

**Player poise.** Players have no poise meter. A hit that deals **≥ 8% of max HP** interrupts the
current action with a 0.3 s stagger; smaller hits only flinch (no interruption). **Hyper armor** (heavy
weapon active frames: Greathammer, Greataxe, Colossal Sword, Club, Mace, Battleaxe, Halberd; and the
skills/spells that grant it) ignores interruptions from any hit. Grabs and holds interrupt regardless.
Effects described as "+N poise" for players raise the interruption threshold by N% of max HP.

**Two-handing** (Shift): the off-hand is disabled (no shield, no off-hand casting; a staff or talisman in the weapon hand still casts, D117). Bonk (strength) counts ×1.5
for scaling and requirements; Slicey does not change (D72). Holding block performs a **weapon guard**: 45% physical, 15% elemental,
stability 12 (stamina drains fast). No parry.

### 5.5 Damage types and statuses (D21)

Types: **Physical, Fire, Frost, Lightning, Holy, Void**. Armor and shields list a defense per type;
shields are built to favor physical (D11). Enemies have resistances (e.g., Crypt undead: weak to Holy
and Fire, resist Frost; Abyss: resist Void, weak to Holy).

Statuses build up on a 0–100 meter, decay 15/s when not applied, and trigger at 100:

| Status | Trigger effect | Typical source |
|---|---|---|
| Burn | 3% maxHP per second for 4 s, refreshes | Fire |
| Chill | −30% move and attack speed for 3 s; +1.5 s on the dodge recharge; at a second trigger while Chilled: **Freeze** 1.5 s | Frost |
| Shock | next hit taken +20% and interrupts the victim's current action; drains 25 stamina | Lightning |
| Bleed | players: burst of 12% maxHP. Enemies: 10% of **current** HP, never less than 3% of maxHP; bosses 5% of current HP | fast physical weapons |
| Poison | 2% maxHP per second for 8 s | Sewers, Caverns |

**Control effects** are not meters; they are applied directly for a fixed duration by the attack or
effect that lists them, and they stack by refreshing, not adding:

| Control effect | Effect | Default duration |
|---|---|---|
| Freeze | cannot act or move (bosses: −50% speed instead) | 1.5 s |
| Blind | screen vignette closes to 35% of the view; enemy telegraphs still draw | 1.5 s |
| Hexed | dodge recharge +2 s while active | 6 s |
| Silence | weapon skills and spells cannot be used | 2 s |
| Root | cannot move; can attack, block, cast; dodge breaks it after 0.5 s | 1–1.5 s |
| Hold (grab) | cannot act; damage is dealt at the end; a teammate hitting the grabber for ≥ 5% of its HP breaks it | 1.2–1.5 s |

Enemies and zones can be **immune** to statuses (`statusImmune` in the data, e.g. Caverns: Poison;
Forge: Burn; Reliquary: Chill/Freeze). Players show status meters and control icons under the HP bar.
Prayer's *Purify* and the *Holy Water* throwable clear all of them.

### 5.6 The two special attack kinds

Every enemy has a **normal attack** and **one or two specials**, and **at least one special is Red or
Piercing**. A second special may be a **utility** (summon, buff, split, trail, teleport, heal, trap):
utilities are telegraphed like normal attacks and follow normal block/dodge rules where they deal damage.

- **Red (unblockable)**: the enemy tints **red** and emits a red pulse 0.6 s before the hit. Block and
  parry fail: you take full damage and are guard-broken. **Dodge through it** (i-frames work) or get
  out of range.
- **Piercing (blue)**: the enemy glows **white-blue** and the exact hit area is drawn on the floor
  for at least 0.8 s before the hit (longer for bigger areas). **I-frames do not help.** Blocking works
  at normal values; parry does not. Leave the area. No attack is ever both Red and Piercing.

**Escapability rule** (enforced by a data test for every Piercing attack): from the worst point of the
area (its center, or the far end of a sweep), a player walking at base speed must be able to reach a
safe spot before the hit lands:

```
(telegraph − 0.1 s) × (260 − pullSpeed) ≥ distanceToSafety + 40 px
```

where `distanceToSafety` is the area radius for circles/cones/lines, the distance to the nearest gap for
`expandingRing` (every Piercing expanding ring must declare ≥ 1 gap of ≥ 90 px), half the lane width
for lanes/grids (so stepping sideways escapes), and, for `pockets`, the distance to the nearest pocket
edge; pocket patterns place at least one pocket within that reach of **every player** at telegraph
start (or the attack has a `condition` that prevents it from being chosen when that is impossible).
Room-wide **Red** bursts are allowed (i-frames beat them) but must have a telegraph ≥ 1.0 s.

Other tested rules: every zone mix has at least one Red user and one Piercing user; every boss has both
kinds and at least two [AREA] attacks.

Colorblind support: Red specials also show a **skull** icon over the enemy; Piercing also shows a
**hollow ring** icon, and the floor area uses a striped fill.

### 5.7 Area attacks

The owner's rule: *enemies have lots of attacks that hit many areas of the map* so solo and co-op are
both busy. The telegraph system supports these **pattern primitives** that content tables reference:

`circle(r)`, `ring(rIn, rOut)`, `line(width, length)`, `cone(angle, r)`, `lanes(n, width)` (vertical or
horizontal lanes across the room), `grid(spacing, r)` (checkerboard of circles), `sweep(arc, duration)`
(a rotating cone), `expandingRing(speed)`, `randomCircles(n, r)`, `wave(width, speed)` (a line that
travels across the room), `pockets(n)` (room-wide except n safe circles), `trail(duration)` (hazard
left behind the mover), `beam(width, turnRate, duration)` (a tracking line).

Each primitive has a telegraph draw and a hit test, plus optional parameters (gaps, orientation, sets,
anchor, persistence as a hazard) defined once in DATA_MODEL §3 (`PatternDef`). Content tables use the
shorthand above; the builder maps it to the schema. Bosses chain them with `sequence`.

### 5.8 Throwables and consumables

Quick-use slot (G) cycles through owned consumables in the inventory: Throwing Knives, Firebombs,
Frost Jars, Holy Water (clears statuses, Holy burst), Stamina Tonic, Shard Pouch, Lure (draws aggro).
Bought at bonfires, found in chests, dropped rarely. Max 10 of each.

## 6. Enemies

### 6.1 Roles

Each zone's 8 types cover these roles so any 4-mix plays well. The role enum is exactly: `fodder`,
`swarm`, `ranged`, `caster`, `support`, `brute`, `assassin`, `tank`, `hazard`. Melee roles: fodder,
brute, assassin, tank. Non-melee: ranged, caster, support, hazard, swarm. Where a content table writes
"Support / Hazard", the **first word** is the role. Full tables in CONTENT_ENEMIES.md.

### 6.2 AI

A state machine per enemy: `idle → alert → approach/kite → windup → attack → recover → (reposition)`.
Each enemy has a **preferred range** and a **move style** (walk, dash, circle, flank, hover, burrow,
teleport, stationary). Attack selection is weighted by distance, cooldowns and a per-attack
"group budget": at most N enemies in a room may be in a special's windup at once (N = 2 in zones 1–3,
3 after), so specials come in readable waves instead of all at once.

Targeting in co-op: aggro score = damage dealt recently × 1.0 + proximity bonus + Lure/taunt bonus;
re-evaluated every 1.5 s. Fodder spread out across targets.

### 6.3 Poise and stagger

Every enemy has a **poise** stat set by its size (D78): poise = 0.05 × radius², so a rat (r 9) has 4, a
skeleton (r 17) 14, a knight (r 24) 29, a brute (r 30) 45, and an Elite (30% bigger) about 70% more. A single
hit **staggers** an enemy (0.6 s, heavy weapons 0.9 s), cancelling the attack it is winding up or swinging,
only when that hit's poise damage reaches the enemy's poise. Hits do not add up: daggers (8) stagger only
swarms, a longsword (25) skeletons and small knights, a greathammer (60) even brutes. Harder swings hit poise
harder in proportion (combo finishers, charged shots, skills), and poise-damage affixes and buffs add on top.
Hyper armor (a heavy enemy's own big swings) doubles its poise for that swing. Bosses instead have a large
poise pool that hits wear down; it refills after 3 s without a hit, and their hyper-armor swings cannot be
staggered. Weapon tooltips show poise damage and what one hit can stagger.

### 6.4 Elites (D21)

8% of spawned enemies solo, 12% / 16% / 20% with 2 / 3 / 4 players (D79; never bosses, never swarm pieces) are **Elite**: ×3 HP, ×1.5 damage, 30% larger,
a colored aura, a named affix shown over them, a guaranteed drop from the Elite row of CONTENT_ITEMS §3
(never Common) and 3× Shards.
Affixes (one each): Frenzied (+40% speed), Armored (−40% physical taken), Vampiric (heals 20% of damage
dealt), Arcane (3 orbiting orbs, Piercing on touch), Molten (fire trail), Frostbound (chill aura 120 px),
Shielded (barrier absorbing 25% maxHP every 10 s), Summoner (spawns 2 fodder every 12 s, max 4).

### 6.5 Mimics

5% of chests are **mimics** (not spell reliquaries, not the tutorial). A mimic looks exactly like a chest;
observant players may notice it breathing (1 px scale pulse) and a slightly warmer lid color.
**Interacting with it** = it bites: solo, instant death (Shardpile appears at the chest; the mimic is then
awake and fights you when you return). In co-op the bite **downs** you (D12). **Attacking it first**
wakes it as a mid-tier enemy (zone-scaled, Red bite, Piercing tongue sweep); kill it and it drops the
chest's loot plus a bonus roll from the Mimic row of CONTENT_ITEMS §3.

## 7. Bosses

8 bosses, one per zone. Each has: an arena with unique hazards, a **boss bar** with a phase marker, an
intro (the boss cutscene of §19, inputs locked), 4–5 attacks in phase 1, and a **phase 2 at 50% HP**: a
transition animation (2 s invulnerable), +20% speed, +25% damage, 2 new attacks, old attacks get
extra projectiles/areas. **The Landlord** (final) has three phases at 66% and 33%. Every boss uses both
Red and Piercing attacks and at least two room-covering patterns. Bosses never spawn as Elites.

Boss kill: 100% Rare+ drop (instanced), 10% Tear of Undoing, 25% a spell reliquary spawns in the arena,
a gem, and big Shards. The stairs down open; the anteroom bonfire is reachable through a reopened door.
Beating a boss increments the character's **bosses beaten** counter (flask upgrades, §9.2).

Full boss sheets: CONTENT_ENEMIES §9.

## 8. Gear

### 8.1 Slots

Main hand (weapon, staff or talisman) · Off hand (shield, staff or talisman) · Head · Body · Legs · 2 Rings · Quick-use.
Weapons and off-hands can be swapped any time from the inventory (not during an attack).

### 8.2 Rarity (Diablo)

| Rarity | Color | Affixes | Sockets (weapon / armor) | Drop weight (fodder) |
|---|---|---|---|---|
| Common | white | 0 | 0 / 0 | 60 |
| Uncommon | green | 1 | 0–1 / 0 | 27 |
| Rare | blue | 2 | 1 / 0–1 | 9 |
| Epic | purple | 3 | 1–2 / 1 | 3.2 |
| Legendary | orange | 3 + a unique legendary power | 2 / 1 | 0.8 |

Elites and bosses roll with shifted weights (CONTENT_ITEMS §3). Drop chance per kill: fodder 18%,
swarm piece 4%, others 30%, elite 100%, boss 100% (plus a second roll at 50%).

### 8.3 Item level and skills

Item level `ilvl` = zone + cycle. Base damage/defense scale with ilvl. **Weapon skills unlock by item
level tier** (owner's rule: early gear has no skills, then 1, 2, 3):

| ilvl | Tier name | Skills unlocked |
|---|---|---|
| 1–2 | Worn | 0 |
| 3–4 | Fine | 1 |
| 5–6 | Masterwork | 2 |
| 7+ | Mythic | 3 |

Legendary rarity adds +1 skill (cap 3), so a Legendary drop in zone 1 already has one skill. The skills
are fixed per weapon class (3 each, CONTENT_ITEMS §4), unlocked in order. Skills sit on Q/E/R with
cooldowns (V Rising); they cost stamina too.

### 8.4 Affixes

Rolled from CONTENT_ITEMS §6: flat/percent damage, elemental conversion, attack speed, cooldown
reduction, Fleet (dodge recharge), stamina cost reduction, lifesteal, status buildup, poise damage,
defense per type, max HP/stamina, Shard find, Glowen find, gem find, revive value, +1 stat.

### 8.5 Gems (V Rising)

Gems slot into sockets and **change how the weapon works, mostly its speed**. A gem carries one to three
**perks**; each perk is one family below with **its own tier** (the perk has the tier, not the gem). Every
perk on a gem is a different family, and a gem is either a **weapon gem** (weapon perks, weapon sockets)
or an **armor gem** (armor perks, armor sockets); the bench, tooltips, pickups and shops show a
"Weapon gem" / "Armor gem" tag.

| Perk | Effect per tier (T1 → T5) |
|---|---|
| Quicksilver | +6/9/12/15/18% attack and cast speed |
| Tempo | −6/9/12/15/18% skill cooldowns |
| Fleetfoot | −0.3/0.45/0.6/0.75/0.9 s dodge recharge (respects the 3 s floor) |
| Brutal | +5/8/11/14/17% damage |
| Ember / Rime / Storm / Dawn / Dusk | converts 20/25/30/35/40% of physical damage to Fire / Magic (frost) / Magic (lightning) / Holy / Void and adds status buildup |
| Leech | 2/3/4/5/6% lifesteal |
| Vigor | −8/12/16/20/24% stamina costs |
| Bulwark (armor) | +8/12/16/20/24 defense to all types |
| Hearth (armor) | +15/22/30/38/45 max HP |
| Zephyr (armor) | +8/12/16/20/24% stamina regeneration |
| Gilt (armor) | +5/8/11/14/17% Glowen found |

**Perk count by cycle**: in the first playthrough every gem has one perk. In NG+ (cycle 1) a gem has a
35% chance of two perks; from NG+2 on, 40% two perks and 25% three (all perks at the drop's tier). The
bonfire shop's gem is always one T1 perk.

Gems drop from enemies (2%), chests (12%), bosses (100%, one), the wandering merchant, and the bonfire
shop (one T1 per zone). **Glowen**: a perk is worth 40 × 3^(tier−1) Glowen and a gem sells for the sum of
its perks; **each perk is upgraded on its own** for 10× its value (T1→T2: 400, T2→T3: 1200, T3→T4: 3600,
T4→T5: 10800), at the gem bench, loose or still socketed in gear you carry. Glowen also comes from selling
gear (10–400 by rarity/ilvl) and rare "Glowen Wisps" drops (better-made gear holds more Glowen, §19).
Gems can be unsocketed for free at a bonfire. There is no re-rolling.

**Fusing**: a gem with two or more perks can be fused with a loose gem of the same kind. You choose which
perks the original gem ends up with from both gems' perks — exactly as many as it had, no family twice, at
least one from each gem (two 3-perk gems: pick any three of the six) — and the other gem is destroyed. Tiers
travel with their perks. Fusing costs the value of the best perk kept (40 × 3^(tier−1)).

## 9. Bonfires, flask, death

### 9.1 Bonfire menu

Rest · Level up · Respec (needs a Tear) ·
Gem bench (socket, unsocket, upgrade each perk — loose or socketed —, sell, fuse; one gem per line) · Shop
(sell gems and gear for Glowen, one by one or with **Sell all** / Sell all Commons / Sell all below Rare —
bag only, never worn gear, socketed gems come back loose, a confirm shows the total; buy throwables,
a T1 gem, and one rotating gear piece at the zone's ilvl re-rolled on each rest, shown with its full stats
compared with what you wear) · Warp (to any
**discovered** bonfire in this playthrough, fresh or ember) · Spell loadout (also available anywhere in
the inventory).

**Resting (D150; was D38):** a bonfire **heals you, refills the Thermos and clears statuses every time you rest
at it.** Resting also respawns the zone's enemies, autosaves and sets your respawn point, and the menu (level up,
shop, gem bench, warp) always works. After the first rest a fire still burns down to embers on the map (used),
which is now only a record of where you have been; in co-op that record stays per player in the host's world
save (`bonfiresUsedByPlayer`). *Changed at the owner's request: it used to heal and refill only on the first
rest at each fire.*

### 9.2 The flask: "Joe's Thermos"

Heals 40% maxHP over 1.5 s (drink animation 1.2 s, you can be hit). **Max charges: 1 at the start; +1
after every 2 bosses beaten** (bosses beaten counter 2, 4, 6, 8 → max 5). Kept in NG+.

Charges come back in exactly **two** ways: **resting** at a bonfire (full refill, every rest, D150) and
**dying** (you respawn with a full Thermos, §9.3). Nothing else restores a charge: no drop, no shop
item, no spell, no affix (a data test asserts that no `EffectDef` or shop entry adds flask charges;
*Joe's Lucky Socks* raises the **maximum**, which is allowed, and *Fortify Thermos* / *Thermos Lid*
change the heal amount, not the count). An empty flask at a boss means you fight with what you have or
die and come back with a full one.

### 9.3 Death (solo)

Screen: "JOE DIED" (cheeky variants: "Joe has fallen down the stairs", "Joe is late for work"). Shards
drop as a Shardpile. Respawn at the last bonfire rested at with **full HP and a full Thermos** (death
refills the flask; the bonfire itself does not, D38); zone enemies respawn (bosses, opened chests,
killed mimics stay done). The map does not change.

## 10. Spells

Spells are cast with a **casting tool** in either hand (off hand, weapon hand or the 2nd weapon slot, D117): a **staff** casts **Brain** spells only, a **talisman**
casts **Prayer** spells only. The tool has **3 spell slots**; any known spell of that school can be
slotted at any time, subject to its requirement. The character keeps **one loadout per school** (a
Brain loadout and a Prayer loadout), so swapping between a staff and a talisman keeps both arrangements.
Spells have a **cooldown** and a **stamina** cost, a
cast time (scaled by cast speed), and most are aimed at the cursor. Spells are **learned** from spell
reliquaries (rare chests) and sometimes bosses; never sold; once learned, known forever on that character.
Brain spells: 14. Prayer spells: 14. Lists in CONTENT_SPELLS_CLASSES §1–2.

Spells are bad at reviving (0.25 revive value per hit, D12) except *Last Rites* (Prayer), the one spell
built for it.

## 11. Chests, reliquaries, the merchant

- **Chest**: 1–2 per zone in treasure rooms, plus 25% of combat rooms have a small chest standing in them from the moment you enter (rolled with the zone, D93; clearing a room never spawns one).
  Loot roll from the matching chest row of CONTENT_ITEMS §3, 12% a gem, 8% consumables bundle. 5% are
  mimics.
- **Spell reliquary**: ornate, glowing. Chance per zone 35% to generate one; also 25% after a boss. Holds
  one spell the character does not know yet (either school), 5% a Tear of Undoing instead. Never a mimic.
- **Wandering merchant** ("Gary"): 20% chance per zone to generate a merchant room (never zone 1). Sells
  3–5 random *special* things for Glowen: an Epic/Legendary at ilvl+1, a T2–T3 gem, 3 random
  consumables, a Tear of Undoing (rare), a **Lucky Charm** ring (+10% Shard find). Each entry says what it is (gear: rarity, class, level, affixes, sockets; gems: kind and perks) and a detail pane shows the full stats of the entry under the pointer or focus, gear compared with what you wear. Hit Gary three times
  and he leaves for the rest of the playthrough (he is nearly unkillable and drops nothing).

## 12. Online co-op (D4, D5, D12, D15, D31, D33)

- **Lobby**: Title → Load character → *Play solo* / *Host* / *Join*. Hosting shows a 6-digit room
  code; guests enter it. Joining happens **only in the lobby**. The host presses Start; everyone enters
  the host's world at the host's last bonfire. "Return to lobby" from the pause menu brings the party
  back (world saved) so more people can join.
- The host simulates everything ([NETCODE.md](NETCODE.md)). Guests send inputs, receive state.
- **Scaling** (D79, replacing D15's per-enemy HP rule): rooms hold **1.5 × players** times the original number of
  enemies (5 solo → 10 → 15 → 20 with 2–4 players) at solo HP, and Elites come more often (8% → 20%). Each room
  enemy's Shards and drop chances are divided by the same factor, so every player earns what they would solo.
  HP (D159): bosses and Elites × (1 + 1.25 × (players − 1)), every other enemy × (1 + 0.75 × (players − 1)). Each
  extra player adds one full wave to every room. Damage unchanged. Shards and loot instanced.
- **Loot** is instanced per player: each player sees and picks up only their own drops.
- **Downed and revive**: at 0 HP a player becomes a ghost (crawls at 90 px/s, cannot act) for 30 s.
  Teammates revive by **hitting the ghost**. Each hit adds the weapon's **revive value** (CONTENT_ITEMS
  §4: greathammer 4 … daggers 0.8; spells 0.25; throwables 0.5). Requirement = 10 × 2^(downs−1), capped at
  40 (10 → 20 → 40 → 40), where *downs* counts how often that player has been downed since the last
  bonfire rest. Revived at 40% HP, 2 s of i-frames; being revived does **not** refill the Thermos. Ghost
  timer expires → the player is **dead** until the party rests at a bonfire or wipes, and returns then
  with full HP and a full Thermos (death refills, §9.3). Everyone down → party wipe → all respawn at the
  host's bonfire with full HP and Thermos, each player's Shards dropped where they fell.
- **Nobody leaves a ghost behind** (D115): while any player is a ghost waiting for a revive, the room's doors
  and the stairs let nobody through; whoever tries hears "Revive *name* first!". A revive or a bleed-out (the
  player is then out until the bonfire and holds nobody up) opens the way again. Everyone down is still a wipe.
- **Friendly fire** (D115): on by default. A player's damaging attacks (weapon swings, shots and thrown
  weapons, weapon skills, damaging spells and their blasts and chains, consumables, burning ground they leave)
  also hit the **other standing players** at the friendly-fire percentage: Settings → Game → *Friendly fire
  damage*, 0–200% in steps of 10, default 100%, 0% = off. The **host's** setting is the party's: it travels to
  guests in the lobby and in every snapshot, and guests see it read-only ("set by the host"); a change mid-run
  applies at once. An ally hit goes through the normal player hit pipeline (i-frames, block and stamina,
  defense, barrier; status buildup scaled the same way) with the damage kind `player`: never parried, never
  riposted (Riposte Stance only blocks it), no stagger for the attacker. Your own attacks never hit you, attacks
  without damage (control, buffs, heals) never hit allies, healing and buffs aimed at allies still work, and
  hitting a **downed** ally's ghost still revives them (D12). Downing an ally counts toward "Friendly Fire";
  letting an ally you downed bleed out counts toward "Not My Problem" (§20).
- **Progress for guests**: Shards, loot, levels, spells, gems, Glowen, flask upgrades always carry
  home. A boss beaten at zone `z` also marks zone `z` beaten in a guest's own world **if** `z` = the
  guest's highest beaten zone + 1 (D31); their world then starts them at the zone `z+1` start bonfire.
- Guests who disconnect are removed after 10 s; their character is saved locally on their side with the
  last confirmed state (the host sends save-relevant deltas to each guest as they happen).
- No pause in co-op; the pause menu is an overlay.

## 13. New Game+

After The Landlord: credits, then a bonfire with **Begin Cycle N+1**. New map seed, zone 1, everything
kept (level, gear, spells, gems, flask max, Glowen). Enemies and Shards follow the New Game+ curve
(§2.3, D209), item level +c, no tutorial, merchant stock improves. The title screen shows the cycle next to
the character.

## 14. Save files

10 slots in `localStorage` (`dj.save.<n>`), JSON, versioned, with a migration table. Export to a
`.dungeonjoe.json` file and import from one. Autosave: bonfire rest, zone transition, boss kill, level
up, pickup (debounced 2 s), every 30 s, and on `beforeunload`. Settings and key bindings are global
(`dj.settings`). Schema in [DATA_MODEL.md](DATA_MODEL.md).

## 15. Classes (D23)

Ten starting classes with different stats, gear and spells (the table in CONTENT_SPELLS_CLASSES §3 is
the source of truth): **Knight** (longsword + kite shield), **Brute** (greathammer, two-handed),
**Duelist** (twin daggers + buckler), **Scholar** (rapier + apprentice staff: Arcane Bolt, Frost Lance),
**Pyre Priest** (censer flail + wooden talisman: Heal, Bless Weapon), **Battlemage** (colossal sword +
targe, apprentice staff on the swap: Arcane Bolt, Scatter Shards), **Hunter** (bow, with a whip in the
bag), **Nobody** (club, a loincloth, one random gem, 8 in everything), **Berserker** (dual twin daggers,
all HP and Endurance), **Zealot** (dawn glaive + silver talisman: Sunray, Bless Weapon). Every starting
kit meets its own requirements (tested). Staffs and talismans may be held in either hand (D117).

Character creation: name (default "Joe"), class, optional **seed** (text; blank = random), a preview of
the vector character with the class's starting gear, and the class's dry one-line blurb.

## 16. UI and HUD

- **HUD**: HP bar (red) and stamina bar (green) top-left with status meters under them; flask count;
  Shards and Glowen counters; Q/E/R skill icons with radial cooldowns; 1/2/3 spell icons; quick-use
  item; dodge recharge ring drawn around the player; minimap top-right (rooms discovered, icons for
  bonfire, chest, boss, merchant); boss bar bottom-center with phase tick; co-op player cards (name,
  HP, status, downed timer) along the left.
- **Menus** are HTML overlays (DOM), the game is Canvas. Title · Save slots · Character creation ·
  Lobby · Pause · Inventory/Character (stats, equipment, 60-slot bag, compare tooltip, gem bench at
  bonfires) · Spell loadout · Map · Settings (video, audio, controls rebinding, accessibility) ·
  Death screen · Credits.
- Item tooltips show: name (rarity color), type, ilvl, tier and skills (locked ones greyed), base
  damage per type, scaling grades, requirements (red if unmet), affixes, sockets with gems, sell value,
  and a flavor line.

## 17. Settings and accessibility

Resolution scale, fullscreen, VSync-ish frame cap, screen shake 0–100%, hitstop on/off, damage numbers
on/off, colorblind telegraph icons (always on, can enlarge), high-contrast telegraphs, master/SFX/music
volume, key rebinding (keyboard and gamepad), aim-assist strength, "hold to block" vs "toggle", co-op friendly
fire damage 0–200% (Game tab, default 100%; the host's value rules a co-op session, §12).

## 18. Glossary of names

Shards (XP currency) · Glowen (the money: a warm ectoplasm everything alive or well-made seeps, §19) · Joe's Thermos (flask) · Shardpile (dropped Shards) ·
Bonfire (the camp stove Joe sits at) · Red attack = "Crimson" · Piercing attack = "Spectral" · Tear of
Undoing (respec) · Spell reliquary · Gary (the wandering merchant) · The Instructor (tutorial boss) ·
The Landlord (final boss) · Cycle (NG+ count).

## 19. Story and Glowen

All story text lives in `src/data/story.ts` (premise, zone and boss cutscene lines, death quips, bonfire lines,
tips, credits epilogue). Tone per D14: the world is grim, the text is dry.

**Glowen** is the money. It is a pale, warm, faintly glowing ectoplasm that seeps out of everything alive or
valuable. The harder someone worked on a thing, the more Glowen soaked into it: a hand-forged sword holds a
fortune, a plastic spoon holds a smell. It is why a lamp feels cosy and a grandmother's ring feels heavier than
it is. That is why the game deals in it:

- **Monsters** are full of Glowen scraped off something else; hit one hard enough and it seeps out.
- **Gear** sells by rarity and item level because rarer, harder-worked things soaked up more of their maker.
- **Gems** are Glowen that set hard under pressure; pouring more in grows them a tier.
- **Bonfires** were lit by the Joes who came down before. Someone always opens a stall by a fire, and down
  here stalls take only Glowen, the one thing the Landlord wants. **Gary** pays no rent and never says where
  anything came from.
- Anything drained of its last Glowen goes **hollow**: Hollow Knights, the Hollow Forest, the Hollow Joes.

**The premise.** The Landlord, at the bottom of the Abyss, holds the deed to everything under the stairs; the
small print says the world above is a sublet. Rent is paid in Glowen, and he is foreclosing on the living
world one glow at a time. The lights went out in Joe's building, so Joe went down the stairs to find the fuse
box. The stairs kept going.

Each boss is a link in the rent chain: **The Caretaker** buries the dead and keeps their Glowen; **Mother Spore**
farms it in the dark; **The Bloatking** skims the rent that drains through the sewers; **Vexthorn** wears the
Hollow Forest's last Glowen as a lantern-heart (the forest was tapped like maple); **Foreman Ignatius** runs a
forge where fine things are made only to be melted down for the Glowen the work put in; **Saint Aurelia**
froze herself at the reliquary door to keep the collectors out and no longer knows Joe isn't one;
**Archmagister Tock** keeps the ledger of every drop owed; **The Landlord** collects. Beating him voids the
lease, every drop goes home, the fuse clicks back on, and the stairs go up (credits). In NG+ the lights go out
again a week later: landlords always come back.

**Cutscenes.** Zone entry (first time per character per cycle, zones 1–8, never in the Training Hall):
letterbox, a drawn vignette in the zone's palette, the zone's name and 2–4 typed lines; it replaces the D57
title card the first time, and the plain card shows on later visits. Boss room lock: the boss storms in and
roars (camera punch-in, shake), then a freeze-frame with its name in huge letters over a slanted panel and its
`introSub` beneath (about 4 s; later solo attempts get the 2 s freeze-frame only; skippable after 0.5 s). The
Instructor gets the freeze-frame alone. Boss defeat: 2–3 letterboxed lines, then the normal reward flow; The
Landlord's lines lead into the credits' epilogue. Everything is skippable with any key, mouse button or gamepad
button. Solo pauses the simulation under a cutscene; co-op cannot pause, so each client plays it as a local
overlay (zone cutscenes end if the party leaves the room) and the host holds the boss and every player's input
for the whole boss intro. Seen cutscenes are stored in `world.cutscenesSeen` (optional, so no migration).
Automated test panes (`?auto=…`) and `?nocut` skip cutscenes; `?cutscenes=1` forces them on.

## 20. Achievements

51 achievements, all in `src/data/achievements.ts` (id, name, description, icon, optional `hidden`, a check
on the tracker's counters, an optional progress bar). They are **account-wide**: one record in
`localStorage` (`dj.achievements`: unlock dates and counters) shared by all ten save slots, rebuilt empty
if missing or corrupt, and unknown ids are kept for newer builds.

- **What counts.** Kills (1 / 100 / 1,000 / 5,000; training dummies and Gary do not count), each of the 8
  bosses, The Instructor, seeing the credits, The Landlord on Cycle 2 (NG+) and Cycle 3 (NG+2), every class
  finishing a zone (any boss kill as that class), deaths (1 / 25 / 100; a death is a solo death or a party
  wipe), being killed by a mimic and killing one, a legendary item, a full armor set from zone 2 or deeper
  (every starting kit is a zone-1 set), a Tier 5 gem, 50 parries, 10 riposte kills, a boss without the
  Thermos, a boss with nothing in the weapon hand, a zone cleared without dying (from arriving by the stairs
  to its boss; a character that has never died counts its current zone) and each of the 8 that way, reviving
  a friend, downing a friend with friendly fire and letting a friend you downed bleed out (D115), a four-player
  party, levels 50 and 100, 10,000 Glowen held, a minute Encumbered, finding Gary and
  driving him off. Six are hidden ("???") until unlocked.
- **The Dark Shard** unlocks with the last of the others.
- **Tracking** (`src/game/achievements.ts`) reads each client's own view: the run scenes pass every frame's
  world events and the local player, so a co-op guest tracks theirs exactly like a host. Party kills count for
  everyone in the room; parries, ripostes, revives and loot count only for the player who did them (`feat`
  events carry the player for ripostes, revives, friendly-fire downs and bleed-outs). The session notes deaths (with the killer) and Gary
  leaving; the scenes note the credits.
- **UI** (`src/ui/achievements.ts`): an unlock toast top-right (icon, name, description, 4 s, queued, a small
  bell); the Achievements screen from the title menu and the pause menu, with the total, The Dark Shard on
  top, unlocked ones first, progress bars on counters. Icons are inline SVG drawn in code.

## 21. Statistics

About forty fun numbers, counted **twice**: per character (in the save, `stats.extra`, so it travels with
export / import; older saves start from the counters they already had — kills, deaths, bosses, elites,
mimics, mimic bites, playtime) and **account-wide** for every character this browser has played, deleted
ones included (`localStorage` `dj.stats`; on the first run it starts from the sum of the existing saves).
Plain counters add up, `best:` ones keep the lowest (fastest boss kills) and `most:` ones the highest.

- **Combat**: enemies killed (and per enemy type and per zone), elites (and per affix), bosses (per boss, with
  the fastest kill from the end of its intro), mimics, damage dealt and taken, the biggest single hit, crits,
  Weak! and resisted hits, parries, ripostes, dodges, blocks, Thermos sips.
- **Death & Shards**: deaths (and per killer; deaths in boss fights), falls into pits, mimic bites, Shards
  gained / spent / dropped on death / recovered, the most held at once, levels gained, Glowen earned / spent.
- **Loot**: items found by rarity, gems found / upgraded / fused, chests opened, Gary visits, purchases and
  Glowen spent at Gary.
- **Exploration**: time played (paused time excluded), distance walked (a tile is a metre), rooms entered and
  cleared, bonfires lit, the deepest zone, NG+ cycles finished.
- **Co-op**: time in co-op, biggest party, revives given / received, times downed.
- **Tracking** (`src/game/stats.ts`) works like the achievements: the run scenes pass each frame's world events,
  the local body and the save; the client counts only its own player (kills and damage carry their source in
  the `death` / `dmg` events, and a `stat` event carries the rest — dodges, blocks, falls, chests, recovered
  Shards — for one player or the party). Shards, Glowen, levels, sips and cycles come from the character's
  numbers changing; distance from the body moving (a jump of more than 40 px in a frame is a teleport). So a
  co-op guest's numbers are theirs, not the host's.
- **Screen** (`src/ui/statistics.ts`): from the title menu and the pause menu, directly below Achievements.
  Tabs "This character" (the title screen picks a save slot) and "All characters"; a headline strip — most
  hated enemy, nemesis, Shards donated to the floor (dropped minus recovered), favourite elite affix to
  flatten, kills per death — then Combat, Death & Shards, Co-op, Loot, Exploration, Bosses and Kills by zone.
