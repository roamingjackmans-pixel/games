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
flask. At the far end stands **The Instructor** (see CONTENT_ENEMIES §10): 120,000 HP, regenerates, slow,
hits like a truck, and the exit door beside it is always open. You are meant to leave. If you somehow kill
it, it drops a random *really good* item: a Legendary weapon with all 3 skills unlocked at zone-3 item
level, or a random spell. The hall is not skippable, but it is short (under two minutes to walk through).

### 2.3 Scaling

Let `z` be the zone number (1–8), `c` the NG+ cycle (0 for the first playthrough), `p` the number of
players.

```
enemyHP     = baseHP  × (1 + 0.55 (z−1)) × 1.6^c × (1 + 1.5 (p−1))
enemyDamage = baseDmg × (1 + 0.35 (z−1)) × 1.35^c
enemyShards = baseShards × (1 + 1.1 (z−1)) × 1.8^c          (per player, instanced)
itemLevel   = z + c  (clamped to the item-level table, CONTENT_ITEMS §2)
```

Expected character level at zone end (solo, first cycle): 12 · 22 · 32 · 42 · 52 · 62 · 72 · 80.
**Tuning target:** clearing every room of a zone once (no deaths, no Elites counted, no chests) yields
100% ± 20% of the Shards needed to go from the zone's expected entry level to its expected exit level
using the §3.3 cost curve and CONTENT_ENEMIES §1 Shard values. A unit test computes the expected yield
from the PROCGEN threat budgets and the role costs and fails outside the band. If it fails, retune the
**Shard values** (not the curve) and record "(tuned)".

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
   effStat = min(99, stat × 1.5) for Bonk and Slicey while two-handing, otherwise stat
spellPower   = spellBase × (1 + 1.2 × f(Brain))  × toolMult        (Brain spells)
healPower    = spellBase × (1 + 1.0 × f(Prayer)) × toolMult        (Prayer spells)
   toolMult  = toolGrade × (1 + 0.35 × (toolIlvl − 1))   (CONTENT_ITEMS §6; spells have no other level scaling)
flaskHeal    = 40% maxHP × (1 + 0.003 × Prayer)
damageTaken  = incoming × 100 / (100 + Def[type]) × status/affix mods
```

### 3.2 Requirements (D37)

Every weapon, shield and casting tool lists minimum stats. Two-handing counts Bonk and Slicey at ×1.5
toward requirements.

- Weapon below requirement: swings at **40% damage**, **skills locked**, a red "!" on the slot.
- Shield below requirement: guards at **half** its block values, cannot parry.
- Staff / talisman below requirement: **cannot cast**.
- Spell below its own Brain/Prayer requirement: cannot be slotted (greyed with the number needed).

### 3.3 Leveling

Enemies drop **Shards** (the soul currency). Spend them at a bonfire. Cost to go from level `L` to
`L + 1` (L is your current level):

```
cost(L) = floor(60 × 1.045^L + 15 L)        L=1:77 · L=10:243 · L=30:674 · L=50:1292 · L=80:3228
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
| Pause / menu | Esc | Start |
| Debug menu | Ctrl+Shift+D (then the owner code) | — |

Gamepad right-stick aim: the character faces the stick direction; when the stick is neutral, melee
attacks go toward the nearest enemy within 160 px of the facing cone, otherwise forward.

## 5. Combat

### 5.1 Movement and aiming

- Logical arena 1280 × 720 px. Player walk speed 260 px/s (modified by Chill, Haste, class perks).
- Twin-stick. Melee swings are centered on the aim direction. Projectiles and spells go to the cursor.
- Aim assist (gamepad): within ±14° of an enemy the aim snaps to it for projectiles.

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

**Two-handing** (Shift): the off-hand is disabled (no shield, no casting). Bonk and Slicey count ×1.5 for
scaling and requirements. Holding block performs a **weapon guard**: 45% physical, 15% elemental,
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

Enemies have **poise**. Each hit subtracts the weapon's poise damage; at 0 the enemy staggers (0.6 s,
heavier weapons 0.9 s) and poise resets after 3 s of no hits. Brutes, tanks and bosses have high poise;
fodder has none (every hit staggers).

### 6.4 Elites (D21)

8% of spawned enemies (never bosses, never swarm pieces) are **Elite**: ×3 HP, ×1.5 damage, 30% larger,
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
intro (name card, 1.5 s, inputs locked), 4–5 attacks in phase 1, and a **phase 2 at 50% HP**: a
transition animation (2 s invulnerable), +20% speed, +25% damage, 2 new attacks, old attacks get
extra projectiles/areas. **The Landlord** (final) has three phases at 66% and 33%. Every boss uses both
Red and Piercing attacks and at least two room-covering patterns. Bosses never spawn as Elites.

Boss kill: 100% Rare+ drop (instanced), 10% Tear of Undoing, 25% a spell reliquary spawns in the arena,
a gem, and big Shards. The stairs down open; the anteroom bonfire is reachable through a reopened door.
Beating a boss increments the character's **bosses beaten** counter (flask upgrades, §9.2).

Full boss sheets: CONTENT_ENEMIES §9.

## 8. Gear

### 8.1 Slots

Main hand (weapon) · Off hand (shield, staff or talisman) · Head · Body · Legs · 2 Rings · Quick-use.
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
defense per type, max HP/stamina, Shard find, Stardust find, gem find, revive value, +1 stat.

### 8.5 Gems (V Rising)

Gems slot into sockets and **change how the weapon works, mostly its speed**:

| Gem | Effect per tier (T1 → T5) |
|---|---|
| Quicksilver | +6/9/12/15/18% attack and cast speed |
| Tempo | −6/9/12/15/18% skill cooldowns |
| Fleetfoot | −0.3/0.45/0.6/0.75/0.9 s dodge recharge (respects the 3 s floor) |
| Brutal | +5/8/11/14/17% damage |
| Ember / Rime / Storm / Dawn / Dusk | converts 20/25/30/35/40% of physical damage to Fire / Frost / Lightning / Holy / Void and adds status buildup |
| Leech | 2/3/4/5/6% lifesteal |
| Vigor | −8/12/16/20/24% stamina costs |
| Bulwark (armor only) | +8/12/16/20/24 defense to all types |

Gems drop from enemies (2%), chests (12%), bosses (100%, one), the wandering merchant, and the bonfire
shop (one T1 per zone). **Stardust**: selling a gem gives 40 × 3^(tier−1) Stardust; upgrading a gem to
the next tier costs 10× its sell value (T1→T2: 400, T2→T3: 1200, T3→T4: 3600, T4→T5: 10800). Stardust
also comes from selling gear (10–400 by rarity/ilvl) and rare "Stardust Motes" drops. Re-rolling a gem
into another random gem of the same tier costs 2× its sell value at the bonfire shop. Gems can be
unsocketed for free at a bonfire.

## 9. Bonfires, flask, death

### 9.1 Bonfire menu

Rest · Level up · Respec (needs a Tear) ·
Gem bench (socket, unsocket, upgrade, re-roll) · Shop (sell gems and gear for Stardust; buy throwables,
a T1 gem, and one rotating gear piece at the zone's ilvl re-rolled on each rest) · Warp (to any
**discovered** bonfire in this playthrough, fresh or ember) · Spell loadout (also available anywhere in
the inventory).

**Resting (D38):** a bonfire **heals you and refills the Thermos only the first time you rest at it.**
After that first rest the fire burns down to embers: resting again still respawns the zone's enemies,
autosaves, and sets your respawn point, and the menu (level up, shop, gem bench, warp) always works, but
HP and flask charges are not restored. The map shows lit bonfires (fresh) and ember bonfires (used).
Each bonfire is fresh once per playthrough; a new NG+ cycle rolls new bonfires. In co-op the first-rest
rule is tracked **per player** in the **host's world save**, keyed by the guest's `playerId`
(`bonfiresUsedByPlayer`), so leaving and rejoining never grants a second first rest.

### 9.2 The flask: "Joe's Thermos"

Heals 40% maxHP over 1.5 s (drink animation 1.2 s, you can be hit). **Max charges: 1 at the start; +1
after every 2 bosses beaten** (bosses beaten counter 2, 4, 6, 8 → max 5). Kept in NG+.

Charges come back in exactly **two** ways: the **first rest** at each bonfire (full refill, D38) and
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

Spells are cast with an **off-hand casting tool**: a **staff** casts **Brain** spells only, a **talisman**
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

- **Chest**: 1–2 per zone in treasure rooms, plus 25% of combat rooms have a small chest after the clear.
  Loot roll from the matching chest row of CONTENT_ITEMS §3, 12% a gem, 8% consumables bundle. 5% are
  mimics.
- **Spell reliquary**: ornate, glowing. Chance per zone 35% to generate one; also 25% after a boss. Holds
  one spell the character does not know yet (either school), 5% a Tear of Undoing instead. Never a mimic.
- **Wandering merchant** ("Gary"): 20% chance per zone to generate a merchant room (never zone 1). Sells
  3–5 random *special* things for Stardust: an Epic/Legendary at ilvl+1, a T2–T3 gem, 3 random
  consumables, a Tear of Undoing (rare), a **Lucky Charm** ring (+10% Shard find). Hit Gary three times
  and he leaves for the rest of the playthrough (he is nearly unkillable and drops nothing).

## 12. Online co-op (D4, D5, D12, D15, D31, D33)

- **Lobby**: Title → Load character → *Play solo* / *Host* / *Join*. Hosting shows a 6-character room
  code; guests enter it. Joining happens **only in the lobby**. The host presses Start; everyone enters
  the host's world at the host's last bonfire. "Return to lobby" from the pause menu brings the party
  back (world saved) so more people can join.
- The host simulates everything ([NETCODE.md](NETCODE.md)). Guests send inputs, receive state.
- **Scaling**: enemy and boss HP × (1 + 1.5 × (players − 1)). Damage unchanged. Shards instanced.
- **Loot** is instanced per player: each player sees and picks up only their own drops.
- **Downed and revive**: at 0 HP a player becomes a ghost (crawls at 90 px/s, cannot act) for 30 s.
  Teammates revive by **hitting the ghost**. Each hit adds the weapon's **revive value** (CONTENT_ITEMS
  §4: greathammer 4 … daggers 0.8; spells 0.25; throwables 0.5). Requirement = 10 × 2^(downs−1), capped at
  40 (10 → 20 → 40 → 40), where *downs* counts how often that player has been downed since the last
  bonfire rest. Revived at 40% HP, 2 s of i-frames; being revived does **not** refill the Thermos. Ghost
  timer expires → the player is **dead** until the party rests at a bonfire or wipes, and returns then
  with full HP and a full Thermos (death refills, §9.3). Everyone down → party wipe → all respawn at the
  host's bonfire with full HP and Thermos, each player's Shards dropped where they fell.
- **Progress for guests**: Shards, loot, levels, spells, gems, Stardust, flask upgrades always carry
  home. A boss beaten at zone `z` also marks zone `z` beaten in a guest's own world **if** `z` = the
  guest's highest beaten zone + 1 (D31); their world then starts them at the zone `z+1` start bonfire.
- Guests who disconnect are removed after 10 s; their character is saved locally on their side with the
  last confirmed state (the host sends save-relevant deltas to each guest as they happen).
- No pause in co-op; the pause menu is an overlay.

## 13. New Game+

After The Landlord: credits, then a bonfire with **Begin Cycle N+1**. New map seed, zone 1, everything
kept (level, gear, spells, gems, flask max, Stardust). Enemies ×1.6^c HP, ×1.35^c damage, Shards
×1.8^c, item level +c, no tutorial, merchant stock improves. The title screen shows the cycle next to
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
**Cleric** (mace + wooden talisman: Heal, Bless Weapon), **Spearman** (spear + round shield), **Hunter**
(bow, with a whip in the bag), **Nobody** (club, a loincloth, one random gem, 8 in everything),
**Berserker** (twin axes), **Occultist** (rapier + void staff: Void Rift, Arcane Bolt). Every starting
kit meets its own requirements (tested).

Character creation: name (default "Joe"), class, optional **seed** (text; blank = random), a preview of
the vector character with the class's starting gear, and the class's dry one-line blurb.

## 16. UI and HUD

- **HUD**: HP bar (red) and stamina bar (green) top-left with status meters under them; flask count;
  Shards and Stardust counters; Q/E/R skill icons with radial cooldowns; 1/2/3 spell icons; quick-use
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
volume, key rebinding (keyboard and gamepad), aim-assist strength, "hold to block" vs "toggle".

## 18. Glossary of names

Shards (XP currency) · Stardust (gem currency) · Joe's Thermos (flask) · Shardpile (dropped Shards) ·
Bonfire (the camp stove Joe sits at) · Red attack = "Crimson" · Piercing attack = "Spectral" · Tear of
Undoing (respec) · Spell reliquary · Gary (the wandering merchant) · The Instructor (tutorial boss) ·
The Landlord (final boss) · Cycle (NG+ count).
