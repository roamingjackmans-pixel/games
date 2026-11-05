# Dungeon Joe — Enemies and Bosses

80 enemies (10 per zone), Elite variants, 8 bosses, the tutorial Instructor, the Mimic, and Gary.
Mechanics are defined in [GAME_DESIGN.md](GAME_DESIGN.md) §5–7; pattern primitives in §5.7.
This file is the source for `src/data/enemies.ts` and `src/data/bosses.ts`.

## 1. Role base stats (zone 1, cycle 0, solo; scaled by GAME_DESIGN §2.3)

Poise in this table is used only for bosses now; every other enemy's poise comes from its size (0.05 × radius², GAME_DESIGN §6.3, D78).

| Role (enum id) | HP | Hit dmg | Move px/s | Poise | Shards | Drop chance | Size (radius px) |
|---|---|---|---|---|---|---|---|
| Fodder (`fodder`) | 60 | 18 | 150 | 0 | 20 | 18% | 18 |
| Swarm, per piece (`swarm`) | 18 | 8 | 240 | 0 | 5 | 4% | 9 |
| Ranged (`ranged`) | 50 | 20 | 130 | 10 | 25 | 30% | 17 |
| Caster (`caster`) | 55 | 22 | 110 | 10 | 30 | 30% | 17 |
| Support (`support`) | 55 | 22 | 110 | 10 | 30 | 30% | 17 |
| Brute (`brute`) | 180 | 40 | 110 | 60 | 70 | 30% | 30 |
| Assassin (`assassin`) | 70 | 28 | 300 (dash) / 170 | 15 | 40 | 30% | 16 |
| Tank (`tank`) | 150 | 26 | 120 | 80 | 60 | 30% | 24 |
| Hazard-maker (`hazard`) | 80 | 20 | 90 | 20 | 40 | 30% | 20 |
| Mimic | 220 | 45 | 200 | 70 | 100 | chest loot + Mimic-row bonus | 22 |
| Boss | 1800 | 45 | varies | 200 | 1200 | 100% + 50% second roll | 44–70 |

An enemy row may override with `×` multipliers. Damage listed per attack is a multiplier of the role's hit
damage. Telegraph times are the pre-hit warning durations. Where a row's Role column has two words
("Support / Hazard"), the **first** is the role enum (GAME_DESIGN §6.1); the second is flavor.

**Reading the tables.** `[RED]` = unblockable (red tint + skull icon). `[PIERCE]` = i-frames ignored, floor
area drawn (blue glow + hollow-ring icon). `[AREA]` = the attack covers a large part of the room. Each
enemy has exactly one normal attack and 1–2 specials; at least one special is Red or Piercing; a special
with neither tag is a **utility** (`kind: 'utility'`). Cooldowns are per attack in seconds. Status
immunities in the zone headers are `statusImmune` on the zone (and apply to its boss).

---

## 2. Zone 1 — Mossy Crypt

Resist Frost 30%. Weak to Holy 30%, Fire 20%.

| Enemy | Role | Movement | Normal attack | Special A | Special B | Notes |
|---|---|---|---|---|---|---|
| **Shambler** | Fodder | shuffles straight at target | Claw swipe: cone(70°, 50), windup 0.5 s, ×1.0 | **Grave Lunge [RED]**: 0.6 s tint, lunges 160 px, line(40, 160), ×1.4, cd 6 | — | Spawns in packs of 4–6. "Still owes rent." |
| **Bone Archer** | Ranged | keeps 350–500 px, strafes | Arrow: projectile 420 px/s, ×1.0, cd 1.6 | **Rain of Bones [PIERCE][AREA]**: randomCircles(5, 70) across the room, telegraph 1.0 s, ×0.8 each, cd 9 | — | Flinches when hit (no poise). |
| **Crypt Rat Swarm** | Swarm | 6 pieces orbit the target then dart | Nibble ×1.0 on contact, 0.4 s cd per piece | **Frenzy [RED]**: all pieces tint 0.6 s then lunge in sequence 0.15 s apart, 150 px each, ×1.0, cd 7 | **Scatter** (utility): when a piece is hit, the remaining pieces burst outward 120 px and re-engage (dodging through a swarm is not free) | Pieces cannot be parried. |
| **Gravedigger** | Brute | slow walk, stops to swing | Shovel overhead: line(50, 90), windup 0.8 s, ×1.2, poise dmg high | **Dirt Toss [RED]**: cone(90°, 220), tint 0.6 s, ×0.9, applies Blind 1.5 s, cd 8 | **Grave Quake [PIERCE][AREA]**: expandingRing(300 px/s) from him to the walls with **2 gaps** (90 px) at random angles, 1.0 s telegraph, ×1.0, cd 12 | Hyper armor on normal swing. |
| **Will-o-Wisp** | Caster | hovers, erratic sine drift, keeps 250 px | Spark bolt: slow homing projectile 240 px/s, ×0.9, cd 2 | **Soul Flare [PIERCE]**: flies to the target, circle(130) telegraph 1.2 s, explodes ×1.6, then teleports away, cd 10 | **Blink**: teleports 300 px when hit twice in 1 s | Takes ×2 from Holy. Lights the room (useful in dark rooms). |
| **Hollow Knight** | Tank | walks, holds shield toward target | Sword 3-hit combo: arcs 90°/90°/thrust, ×0.9/×0.9/×1.3 | **Shield Charge [RED]**: 0.6 s tint, charges 260 px line(60, 260), ×1.5, cd 9 | — | Front guard blocks 80% of player damage; flank, parry the combo, or stagger it with a longsword or anything heavier (poise 24 from its size, D78). |
| **Ghoul Leaper** | Assassin | circles at 300 px then dashes | Double slash: 2 fast arcs ×0.8 each | **Pounce [RED]**: from up to 450 px, tint 0.6 s, leaps in 0.35 s, circle(60) on landing ×1.6, cd 7 | **Mist Step**: below 30% HP, vanishes 1.5 s and reappears behind the target | Bleed buildup 25 per hit. |
| **Plague Bell** | Hazard-maker | stationary (floats 1 px) | Chime: ring(0, 90) around it, windup 0.5 s, ×0.6, cd 3 | **Toll [PIERCE][AREA]**: three expandingRing(220 px/s) spaced 1.2 s apart with 2 gaps of 90 px that rotate position; telegraph 1.0 s; ×0.8 each; cd 14 | **Raise Dead** (utility): resurrects one fallen non-elite enemy in the room at 50% HP (max 2 per room), 2 s channel (interruptible by any stagger) | Kill priority. "Rings for thee." |
| **Weeping Mourner** | Support | hovers, keeps 280 px | Teardrop: slow homing projectile 260 px/s ×0.9 Void, cd 2.2 | **Wail [PIERCE]**: cone(70°, 240) telegraph 1.0 s, ×0.6 Void, **Silence** 2 s, cd 10 (budget 1) | **Lament** (utility): heals one injured ally 25% over 2 s (interruptible) | Undead. "Cried at the reading of the will. Was not in it." |
| **Pallbearer** | Brute (speed 100) | slow walk, coffin on the shoulder | Coffin swing: arc(120°, 90), windup 0.8 s, ×1.2 | **Committal [RED]**: tint 0.65 s, line(60, 120) grab, shut in the coffin 1.4 s, ×0.6 + ×1.8 when the lid opens, cd 13 | — | Hyper armor. Undead. "Has carried the same coffin for three hundred years. Still looking for a tenant." |

## 3. Zone 2 — Fungal Caverns

Resist Poison (immune). Weak to Fire 35%.

| Enemy | Role | Movement | Normal attack | Special A | Special B | Notes |
|---|---|---|---|---|---|---|
| **Sporeling** | Fodder | waddles | Headbutt: circle(40) ×1.0 | **Spore Puff [PIERCE]**: circle(70) telegraph 0.8 s, ×0.5, Poison 40, cd 6 | **Spore Burst** (utility, on death): circle(90) Poison cloud for 4 s (Poison buildup 30/s inside) | Packs of 5. Killing them in melee is a choice. |
| **Cave Hound** | Fodder ×1.2 HP, fast (220) | pack of 3, flanks (one circles each side) | Bite ×1.0 | **Lunge [RED]**: tint 0.6 s, 200 px dash, ×1.3, cd 5 | — | Pack AI: never all lunge at once (budget 1). |
| **Myconid Shaman** | Caster | keeps 300 px, slow | Spore bolt: projectile ×0.9, Poison buildup 20 | **Spore Bloom [PIERCE][AREA]**: grid(160, 55) over the whole room pulsing 3 times, telegraph 1.2 s, ×0.7 per pulse, cd 12 | **Mend**: heals one ally 25% over 2 s (channel) | Caster with a hat. |
| **Boulder Beetle** | Tank | slow walk; turns slowly | Mandible bite ×1.1 | **Roll [RED][AREA]**: tint 0.6 s, rolls wall to wall along a line(80, room), bounces once off the wall, ×1.4, cd 10 | — | Shell: frontal hits deal 30% until it is flipped by a parry or a poise break (then 4 s exposed ×2 dmg). |
| **Glowcap Spitter** | Ranged | keeps 380 px | Acid glob: lobbed projectile, circle(50) puddle 5 s (Poison 25/s) ×0.8 | **Acid Rain [PIERCE][AREA]**: randomCircles(8, 60) telegraph 1.0 s then puddles, ×0.6, cd 11 | — | Puddles are the real damage; cull it early. |
| **Fungal Ogre** | Brute | lumbering | Club smash: circle(80) ×1.2, windup 0.9 s | **Ground Pound [PIERCE]**: ring(0, 240) telegraph 1.2 s, ×1.3, knockback 180 px, cd 9 | **Grab [RED]**: tint 0.6 s, line(60, 110), on hit holds the player 1.5 s and slams ×2.0, cd 14 | Hyper armor on everything. |
| **Spore Bat** | Swarm (4 pieces) | flies in loops, swoops | Swoop ×1.0 on contact | **Screech [PIERCE]**: cone(60°, 140) 0.8 s telegraph, ×0.5, staggers 0.4 s, cd 8 (budget 1) | — | Erratic; aim assist helps gamepad here. |
| **Mycelium Weaver** | Hazard-maker | stationary at a wall | Tendril whip: line(30, 200) ×0.9 | **Lay Lines [AREA]**: shoots 3 tendril lines to random walls; crossing a line deals ×0.5 and Chill-like slow 1 s; lines last 8 s (max 4 in the room) | **Lash [PIERCE]**: all existing lines pulse at once, telegraph 1.0 s, ×1.0, cd 12 | Lines are destructible (20 HP). |
| **Lanternjaw** | Assassin | flanks at 140 px; invisible beyond 220 px | Snap: 2 arcs(80°, 60) ×0.7/×0.9, Bleed 20 | **Lure Lunge [RED]**: tint 0.65 s, leaps from up to 420 px, circle(64) on landing ×1.7, cd 8 | — | An eyeless cave angler: only its lure gives it away. "Carries its own lamp. You are not the first moth." |
| **Lichen Hermit** | Support | slow walk (90), keeps 300 px | Pipe puff: projectile 240 px/s ×0.8, Poison 20 | **Smoke Rings [PIERCE][AREA]**: two expandingRing(240 px/s) 1.2 s apart, 4 gaps of 90 px (one toward the room centre), telegraph 1.0 s, ×0.6 + Poison 30, cd 13 (budget 1) | **Lichen Coat** (utility): barrier on an ally worth 20% of its max HP, 10 s, cd 10 | "Has sublet the same cave for sixty years. Pays the rent in moss." |

## 4. Zone 3 — Drowned Sewers

Resist Frost 20%, Poison immune. Weak to Lightning 40% (wet).

| Enemy | Role | Movement | Normal attack | Special A | Special B | Notes |
|---|---|---|---|---|---|---|
| **Drowned** | Fodder | slow, groups of 4–6 | Slap ×1.0 | **Drowning Hug [RED]**: tint 0.6 s, grab circle(45), holds 1.2 s dealing ×1.5 and 30 stamina, cd 7 | — | Rises from water tiles (spawn tell: bubbles 1 s). |
| **Green Slime** | Fodder ×0.8 HP | bounces toward target | Bounce ×0.9 | **Split**: on death splits into 2 small slimes (×0.3 HP, ×0.5 dmg) once | **Burst [PIERCE]**: circle(100) telegraph 0.9 s, ×1.1, applies Poison 40, cd 8 | — |
| **Sewer Crocodile** | Brute | lurks (submerged, 50% dmg taken) then bursts | Snap: cone(50°, 80) ×1.3 | **Death Roll [RED]**: tint 0.6 s, lunge 180 px then spin circle(90) ×2.0, cd 11 | **Tail Sweep [AREA]**: sweep(360°, 0.8 s) r 150, ×1.0, cd 7 | Hyper armor. |
| **Rat Physician** | Caster | keeps 320 px, scurries | Vial toss: circle(60) Poison puddle 6 s ×0.6 | **Miasma [PIERCE][AREA]**: room-wide fog with pockets(3) safe circles r 110, telegraph 1.5 s, ×0.9 per second for 3 s outside pockets, cd 16 | **Prescribe**: buffs an ally +30% dmg 8 s | Wears a beak mask. "Not that kind of doctor." |
| **Harpooner** | Ranged | keeps 400 px | Harpoon: projectile 520 px/s ×1.0 | **Reel [RED]**: tint 0.6 s, harpoon line(24, 450); on hit pulls the player to him over 0.6 s then stabs ×1.4, cd 10 | — | Projectile is parryable (reflects). |
| **Leech Swarm** | Swarm (5 pieces) | wriggle, fast | Attach ×0.6 and drains 10 stamina per second while attached (shake off by dodging) | **Leap [RED]**: pieces tint 0.6 s then jump 150 px onto the target, ×0.8 and attach, cd 6 | — | Burn kills attached leeches. |
| **Bloated Carrier** | Hazard-maker ×1.3 HP | slow walk toward target | Slap: circle(50) ×0.8, windup 0.6 s | **Detonate [PIERCE]**: at 90 px or on death: circle(150) telegraph 1.2 s (swells), ×2.0 + Poison 60, cd — | **Birth** (utility): on death also releases a Leech Swarm (3 pieces) | Kill at range or let it chase into other enemies (friendly fire from its blast ×1.0). |
| **Tide Caller** | Caster / Hazard | stationary on a grate | Water bolt ×0.9 | **Wave [PIERCE][AREA]**: wave(120, 320 px/s) travels across the room from a wall; raised grates (room template props) are safe; telegraph 1.2 s; ×1.3, knockback; cd 11 | **Flood**: raises water in the room for 10 s: everyone moves −15% (enemies too), Lightning deals +40% | Two Tide Callers alternate wave directions. |
| **Sewer Diver** | Tank (speed 95) | walks, helmet toward target (turn 160°/s) | Wrench: 2 arcs(90°, 72) ×1.0/×1.2 | **Anchor Drop [RED]**: tint 0.8 s, the anchor lands on circle(80) at the target ×1.6, knockback 120, cd 9 | — | Front guard 60% (the helmet). Undead. "Came down in 1874 to fix a leak. The leak won." |
| **Fuse Eel** | Assassin (speed 170) | swims submerged (50% dmg taken) until close | Bite: arc(70°, 56) ×1.0 Lightning (Magic), Shock 20 | **Live Wire [RED]**: tint 0.6 s, lunge 220 px line(36, 220) ×1.4 | **Discharge [PIERCE]**: circle(120) around it, telegraph 1.0 s, ×1.3, Shock 50, cd 9 | "Joe has found the fuse box. It has found Joe." |

## 5. Zone 4 — Hollow Forest

Resist Holy 20%. Weak to Fire 40%.

| Enemy | Role | Movement | Normal attack | Special A | Special B | Notes |
|---|---|---|---|---|---|---|
| **Hollow Wolf** | Fodder ×1.3 HP, fast (240) | pack of 3–4, circles and flanks | Bite ×1.0, Bleed 20 | **Lunge [RED]**: tint 0.6 s, 240 px, ×1.3, cd 5 (budget 1 per pack) | — | Howl on first sight buffs pack speed +15% 5 s. |
| **Thornling** | Fodder ×0.7 HP | hops | Scratch ×0.8 | **Bramble Burst [PIERCE]**: circle(80) telegraph 0.8 s ×1.0, leaves thorns 4 s (×0.3/s), cd 7 | — | Groups of 5. |
| **Fey Archer** | Ranged | keeps 420 px, blinks 150 px when approached (cd 4) | Curving arrow: projectile that arcs toward the target ×1.0 | **Arrow Storm [PIERCE][AREA]**: lanes(5, 90) alternating vertical lanes, telegraph 1.0 s, ×0.9, cd 10 | — | — |
| **Treant** | Tank ×1.5 HP | very slow (60) | Branch slam: circle(90) ×1.3 | **Root Slam [RED]**: tint 0.6 s, line(70, 220) ×1.5, cd 9 | **Root Lines [PIERCE][AREA]**: 4 line(40, room) from the Treant to the walls at random angles, telegraph 1.2 s, ×1.0, roots persist 3 s as walls, cd 14 | Weak to Fire ×2 (Burn ticks ×2). |
| **Witch of the Glade** | Caster | teleports every 6 s, keeps 300 px | Hex bolt: projectile ×0.9 applies **Hexed** (dodge recharge +2 s, 6 s) | **Hex Circle [PIERCE]**: circle(140) under the target telegraph 1.0 s, ×1.4, cd 9 | **Mirror**: spawns 2 illusions (1 HP, no damage) that mimic her | Illusions die to any hit. |
| **Stag Sentinel** | Brute (speed 130, charge 600) | paces, lines up | Antler sweep: cone(120°, 110) ×1.1 | **Charge [RED][AREA]**: tint 0.8 s, charges along line(90, room) wall to wall, ×1.8, then stunned 1.5 s on the wall (punish window), cd 10 | — | Hyper armor during charge. |
| **Pixie Swarm** | Swarm (5 pieces) | flutters, darts | Poke ×0.7 | **Flash [PIERCE]**: cone(90°, 160) telegraph 0.8 s, ×0.3, Blind 1.5 s, cd 9 | **Pickpocket**: a piece that touches you steals 2% of your Shards (recovered on killing it) | Cheeky. |
| **Hollow Huntsman** | Assassin | stealth (70% transparent) until 200 px | Knife ×1.0 | **Backstab [RED]**: from stealth behind the target, tint 0.6 s, ×2.2, cd 12 | **Trap**: places up to 3 bear traps in the room (visible, 1 s arm): trigger = root 1.5 s + ×1.0 | Traps also catch enemies. |
| **Hollow Scarecrow** | Hazard-maker | stationary on its post | Crow: homing projectile 280 px/s ×0.8, cd 2.2 | **Murder of Crows [PIERCE][AREA]**: randomCircles(7, 60) across the room, telegraph 1.0 s, ×0.8, cd 11 | — | Burn kills it fast. "Scares nothing. The crows are on its payroll." |
| **Beekeeper** | Support | walks (100), keeps 300 px | Bee Line: 3 homing bees ×0.5, Poison 15 | **Kicked Hive [PIERCE]**: circle(110) at the target, telegraph 1.0 s, ×1.2 + Poison 40, leaves a poison cloud 4 s, cd 10 | **Royal Jelly** (utility): an ally +30% damage 8 s, cd 10 | "Pays the rent in honey. The Landlord is allergic." |

## 6. Zone 5 — Ashen Forge

Resist Fire (immune), Burn immune. Weak to Frost 40%.

| Enemy | Role | Movement | Normal attack | Special A | Special B | Notes |
|---|---|---|---|---|---|---|
| **Cinder Cultist** | Fodder | walks, groups of 4 | Fire dagger ×1.0 Fire, Burn 20 | **Fire Dash [RED]**: tint 0.6 s, lunge 180 px line(40, 180) ×1.2 Fire leaving a 2 s fire trail, cd 7 | **Self-Immolation** (utility, on death): circle(70) fire puddle 4 s (Burn 30/s) | — |
| **Forge Hound** | Fodder ×1.2 HP, fast (230) | pack of 3 | Bite ×1.0 Fire | **Lunge [RED]** ×1.3, cd 5 | **trail(3 s)** fire trail behind it while moving | Puddles stack with Cultist puddles. |
| **Pyromancer** | Caster | keeps 320 px | Fireball: projectile circle(50) on impact ×1.0 Fire | **Flame Pillars [PIERCE][AREA]**: grid(140, 50) erupts in 2 alternating sets (checkerboard A then B), telegraph 1.0 s each, ×1.1 Fire, cd 12 | **Fire Wall**: a line(40, room) of fire across the room for 6 s (crossing = Burn 40 + ×0.5), cd 15 | Fire Wall splits the arena; plan the crossing. |
| **Anvil Golem** | Tank ×1.3 HP | slow (80) | Hammer slam: circle(80) ×1.4 | **Forge Strike [RED]**: tint 0.7 s, line(80, 160) ×1.8, cd 9 | **Molten Shockwave [PIERCE][AREA]**: expandingRing(280 px/s) with a 100 px gap that is always on the Golem's back side, telegraph 1.0 s, ×1.2, cd 12 | Stand behind it for the ring. |
| **Slag Crawler** | Swarm (4 pieces) | crawls, slow (120) | Lava touch ×0.8 Fire | **Erupt [PIERCE]**: circle(80) under each piece, telegraph 0.8 s, ×1.0 Fire, cd 8 | **trail(5 s)** (utility) slag puddles | Low threat, high floor paint. |
| **Bellows Brute** | Brute | walks | Bellows punch ×1.2 | **Flame Sweep [PIERCE][AREA]**: sweep(180°, 2.4 s) cone r 300 rotating around him, telegraph 1.0 s shows the start wedge, ×0.9 Fire per 0.3 s, cd 14 | **Grab-and-Burn [RED]**: tint 0.6 s, line(60, 110), hold 1.5 s ×2.0 Fire, cd 14 | Sweep rotates clockwise, always; walk with it. |
| **Ash Wraith** | Assassin | phases through props; invisible while > 250 px | Ember claw ×1.0 Fire | **Ember Strike [RED]**: tint 0.6 s, appears at the target's back, line(50, 120) ×1.8, cd 9 | **Scatter**: below 40% HP, bursts into 3 embers (circle(40) each ×0.5) and reforms elsewhere | — |
| **Furnace Priest** | Support / Hazard | stationary, chants | Ember Bolt: proj(380) ×0.8 Fire, cd 2 | **Immolation Nova [PIERCE][AREA]**: room-wide pockets(1): the only safe circle (r 120) is **around the Priest himself**; telegraph 2.2 s; ×2.5 Fire; cd 18; `condition: allPlayersWithin(500)` (otherwise he picks Enrage) | **Enrage** (utility): all enemies +25% damage and +15% speed for 8 s, cd 15 | Run toward the scary thing. |
| **Rivet Gunner** | Ranged | keeps 400 px, strafes | Hot rivet: projectile 480 px/s ×1.0 Fire, Burn 15, cd 1.6 | **Riveting [PIERCE][AREA]**: randomCircles(6, 60), telegraph 1.0 s, ×0.9 Fire, each leaves slag 3 s, cd 10 | — | "Paid by the rivet. Not fussy about where they go." |
| **Crucible Bearer** | Hazard-maker ×1.2 HP | slow walk (80), keeps 120 px | Splash: cone(60°, 140) ×0.9 Fire, fire puddle 3 s | **Tip the Crucible [PIERCE]**: cone(80°, 240), telegraph 1.1 s, ×1.4 Fire + Burn 40, slag 4 s, cd 12 | — | "The health and safety officer. Nobody asks what happened to the last one." |

## 7. Zone 6 — Frozen Reliquary

Resist Frost (immune), Chill immune. Weak to Fire 40%, Lightning 20%.

| Enemy | Role | Movement | Normal attack | Special A | Special B | Notes |
|---|---|---|---|---|---|---|
| **Frost Knight** | Tank | walks, guards front | Sword combo 3 hits ×0.9/×0.9/×1.2 Frost, Chill 15 each | **Frostbite Thrust [RED]**: tint 0.6 s, line(40, 200) ×1.6 Frost, Chill 60, cd 8 | — | Front guard 70%; combo is parryable. |
| **Reliquary Wraith** | Caster | floats, keeps 300 px, through props | Frost bolt ×0.9 Frost, Chill 25 | **Frost Nova [PIERCE][AREA]**: expandingRing(320 px/s) with 2 gaps (90 px), telegraph 1.0 s, ×1.2 Frost, Chill 50, cd 11 | **Haunt** (utility): becomes invulnerable and 80% transparent 3 s when below 50% HP, cd 15 | — |
| **Icicle Lurker** | Assassin | clings to the ceiling (not targetable), shadow on floor shows position; drops | none | **Drop [PIERCE]**: shadow circle(70) telegraph 1.0 s, drops ×1.8, then fights on foot (claws ×1.0), cd — | **Shatter [RED]** on foot: tint 0.6 s, circle(90) ×1.4, cd 8 | 2–3 per room; the shadows wander. |
| **Frozen Hound** | Fodder ×1.2 HP, fast (230) | pack of 3 | Bite ×1.0 Frost, Chill 20 | **Lunge [RED]** ×1.3, cd 5 | — | — |
| **Choir Acolyte** | Support | stationary, groups of 2 | Hymn Bolt: proj(360) ×0.7 Frost, cd 2 | **Hymn of Silence [PIERCE][AREA]**: expandingRing(260 px/s) with 2 gaps, telegraph 1.0 s, ×0.5 and **Silence** 2 s, cd 12 | **Choir Shield** (utility): barrier on one ally absorbing 20% of its maxHP, cd 10 | Two acolytes alternate rings. |
| **Glacial Golem** | Brute ×1.4 HP | slow (70) | Ice slam: circle(90) ×1.4 Frost | **Avalanche [PIERCE][AREA]**: lanes(4, 110) boulders roll across the room through those lanes, telegraph 1.2 s, ×1.5, cd 13 | **Ice Slam [RED]**: tint 0.7 s, line(90, 150) ×1.8 Frost, Chill 80, cd 9 | Boulders leave ice patches (slippery: −40% control 0.5 s). |
| **Hoarfrost Archer** | Ranged | keeps 400 px | Ice arrow ×1.0 Frost, leaves a circle(40) ice patch 5 s | **Volley [PIERCE][AREA]**: randomCircles(6, 65) telegraph 1.0 s, ×0.8, patches, cd 10 | — | — |
| **Relic Guardian** | Tank ×1.6 HP | slow (90), always faces target | Mace ×1.2 (unparryable) | **Shield Crush [RED]**: tint 0.6 s, line(80, 120) ×1.7, cd 9 | — | **Unbreakable front guard** (blocks 100%); must be hit from behind (its turn speed is 120°/s; dodge through it to get behind). |
| **Rime Moths** | Swarm (5 pieces) | circle the target at 90 px, dart in | Flutter: dart 100 px line(24, 100) ×0.8 Frost (Magic), Chill 10 | **Frost Dust [PIERCE]**: circle(70) around each piece, telegraph 0.9 s, ×0.6, Chill 40, cd 9 (budget 1) | — | Pieces cannot be parried. "Ate every vestment in the Reliquary. Your jumper is next." |
| **Frozen Censer** | Hazard-maker | stationary, hangs on its chain | Incense puff: ring(0, 100) ×0.6 Frost, Chill 20, cd 3 | **Thurible Swing [PIERCE][AREA]**: sweep(360°, 2.4 s) r 230 around it, telegraph 1.0 s, ×1.2, Chill 40, cd 12 | — | Construct. "Burns frankincense at minus forty. Smells like a freezer full of church." |

## 8. Zone 7 — Clockwork Citadel

Resist Physical 20% (metal). Weak to Lightning 40%.

| Enemy | Role | Movement | Normal attack | Special A | Special B | Notes |
|---|---|---|---|---|---|---|
| **Tin Soldier** | Fodder ×1.1 HP | marches in a line formation of 4 | Bayonet thrust: line(30, 80) ×1.0 | **Volley Fire [PIERCE][AREA]**: the formation fires line(30, room) shots in a row, telegraph 1.0 s, ×1.0 each, cd 9 | — | Formation gaps are the dodge lanes. |
| **Clockwork Spider** | Swarm (4 pieces) | skitters fast (260) | Bite ×0.9 Shock 15 | **Pounce [RED]** ×1.2, cd 6 (budget 1) | **Self-destruct**: at 20% HP, explodes circle(60) ×1.0 after 0.8 s | — |
| **Gear Turret** | Ranged ×1.5 HP | stationary | Bolt ×1.0 | **Laser Sweep [PIERCE][AREA]**: sweep(360°, 3.0 s) line(30, room) rotating beam, telegraph 1.0 s shows the start angle and direction, ×1.0 per 0.25 s, cd 12 | — | Turrets rotate opposite directions when there are two. |
| **Brass Juggernaut** | Tank ×1.5 HP | slow (90) | Piston punch: line(60, 110) ×1.4 | **Steam Vent [PIERCE]**: cone(100°, 260) telegraph 1.2 s, ×1.2 + Burn 40, cd 9 | **Overdrive [RED]**: tint 0.7 s, 3 rapid punches line(60, 130) ×0.9 each, cd 12 | Backplate exposed: ×1.5 damage from behind. |
| **Citadel Magister** | Caster | teleports every 5 s, keeps 350 px | Arcane bolt ×1.0 Void | **Time Bubble [PIERCE][AREA]**: 3 circle(130) zones for 6 s: inside, players move and act at 60% speed (dodge recharge slowed), telegraph 1.0 s, cd 13 | **Mirror Images**: 2 illusions (1 HP) | — |
| **Pendulum Knight** | Brute | walks (100) | Blade arc ×1.3 | **Pendulum [PIERCE][AREA]**: sweep(360°, 2.0 s) r 220 giant blade, telegraph 1.0 s, ×1.5, cd 12 | **Overhead [RED]**: tint 0.7 s, line(70, 200) ×1.9, cd 9 | Hyper armor. |
| **Repair Drone** | Support | hovers, keeps 250 px from players, near constructs | Spark: proj(400) ×0.5 Lightning, cd 2 | **Zap [PIERCE]**: cone(50°, 140) telegraph 0.8 s, ×0.6 Lightning, Shock 30, cd 7 | **Repair** (utility): heals one construct 20% per 2 s channel; also drops circle(90) oil for 10 s where it hovers (slippery; ignites on Fire: ×1.2 Fire burst + Burn) | Kill first; its oil is a tool for Fire builds. |
| **Chronomancer's Hand** | Assassin | blinks around (cd 3) | Slash ×1.0 | **Rewind Strike [PIERCE]**: targets the player's position from **1.0 s ago**, circle(80) telegraph 0.6 s, ×1.8, cd 6 | **Stasis [RED]**: tint 0.6 s, line(40, 150) ×1.2, on hit applies **Freeze** 1.5 s, cd 12 | Keep moving and it never lands. |
| **Cuckoo Clock** | Hazard-maker | stationary | Cuckoo: homing projectile 320 px/s ×0.9, cd 2 | **Tick-Tock [PIERCE][AREA]**: grid(150, 55) in 2 checkerboard sets 1.0 s apart, telegraph 1.0 s, ×1.1, cd 12 | — | Never flinches. "Cuckoo. Cuckoo. Your rent is due. Cuckoo." |
| **Clockwork Butler** | Fodder ×1.3 HP | walks, pairs or threes | Silver tray: arc(100°, 58) ×1.0 | **Silver Service [RED]**: tint 0.6 s, lunge 200 px line(40, 200) ×1.4, cd 8 | — | Construct. "Will see you out." |

## 9. Zone 8 — The Abyss (final)

Resist Void 50%. Weak to Holy 40%.

| Enemy | Role | Movement | Normal attack | Special A | Special B | Notes |
|---|---|---|---|---|---|---|
| **Hollow Joe** | Fodder ×1.3 HP | walks like the player | Uses the light combo of one of Longsword, Club, Twin Daggers or Spear (rolled per spawn) ×1.0 | **Hollow Lunge [RED]** ×1.4, cd 6 | **Flask** (utility): drinks once at 30% HP (heals 40%, 1.2 s, interruptible) | Drawn as a grey copy of the player. "He looks tired." |
| **Void Mote Swarm** | Swarm (6 pieces) | orbits the target at 120 px | Touch ×0.7 Void | **Collapse [PIERCE]**: all pieces converge on the target, circle(90) telegraph 1.0 s, ×1.3 Void, cd 9 | — | — |
| **Eye of the Deep** | Ranged / Caster | floats, blinks when approached | Gaze bolt ×1.0 Void | **Gaze Beam [PIERCE][AREA]**: a line(26, room) beam that tracks the target at 40°/s for 3 s, telegraph 1.0 s, ×0.8 per 0.25 s, cd 12 | — | Outpace the beam by running around it. |
| **Abyssal Knight** | Tank ×1.4 HP | walks | Greatsword combo 2 hits ×1.2/×1.4 Void | **Void Cleave [RED][AREA]**: tint 0.8 s, line(100, room) from him through the target to the wall, ×2.0 Void, cd 10 | — | Front guard 70%; combo parryable. |
| **Nullwraith** | Assassin | invisible until 160 px; moves 320 | Claw ×1.0 Void | **Grasp from Below [RED]**: tint 0.6 s, circle(60) at the target's feet, pulls down and holds 1.2 s ×1.6, cd 9 | **Fade** (utility): invulnerable 1 s after each attack | Shown as a faint shimmer; Holy damage reveals it for 4 s. |
| **Maw** | Hazard-maker ×2 HP | stationary | Gnash: cone(90°, 100) ×1.0, windup 0.5 s, cd 2 | **Bite [PIERCE]**: circle(150) around it, telegraph 1.0 s, ×2.2, cd 7 (escapable: pull 60 → (0.9 × 200) = 180 ≥ 150 + 40 − 10; the pull stops during the last 0.2 s of the telegraph) | **Pull** (utility, passive): constant gravity toward it, 60 px/s within 350 px | Pull + Bite is the whole fight; kill it at range or fight at its edge. |
| **Landlord's Clerk** | Support | keeps 300 px, floats | throws **Eviction Notices**: 3 homing paper projectiles ×0.6 Void each | **Late Fee**: buffs all enemies +20% damage 8 s, cd 14 | **Audit [PIERCE][AREA]**: pockets(2) room-wide, telegraph 1.5 s, ×1.5 Void, cd 18 | "Per section 4(b)…" |
| **Star-Eater** | Brute ×1.5 HP | slow (90) | Claw ×1.4 Void | **Supernova [PIERCE][AREA]**: pockets(3) safe circles r 100, telegraph 1.8 s, ×2.8 Void, cd 16 | **Devour [RED]**: tint 0.7 s, line(70, 130) grab, hold 1.5 s ×2.2 Void, cd 12 | Hyper armor. |
| **The Fine Print** | Caster | floats, keeps 320 px | Small Print: 3 paper projectiles ×0.6 Void | **Terms and Conditions [PIERCE][AREA]**: lanes(5, 80) horizontal, alternating sets 0.8 s apart, telegraph 1.0 s, ×1.0 Void, cd 11 | — | "You agreed to this. Page 4,011, paragraph 9." |
| **The Bailiff** | Tank ×1.3 HP (speed 100) | walks | Truncheon: 2 arcs(90°, 75) ×1.0/×1.2 Void | **Eviction [RED]**: tint 0.7 s, shoulder charge 240 px line(70, 240) ×1.6 Void, knockback 240, cd 10 | — | Hyper armor on the charge. "Here to collect. Accepts Glowen, furniture or Joe." |

---

## 10. Special non-roster enemies

**The Instructor** (tutorial hall). 120,000 HP, regenerates 2% per second out of combat (5 s), poise
infinite, moves at 70 px/s, damage ×6 of the Fodder base (one hit is most of a level-1 health bar). Attacks:
Overhead (line(80, 160), windup 1.4 s), **Red** Stomp (circle(140), tint 1.0 s), **Piercing** Clap
(ring(60, 260), telegraph 1.5 s). It never leaves its half of the hall. Drops on death: one Legendary
weapon (random class) at ilvl 3 with 3 skills unlocked, or (50%) a random spell. Flavor: "He has a
whistle. He will use it."

**Mimic.** Chest-shaped until woken. Woken stats per §1 (scaled by zone). Attacks: Bite (cone(60°, 70)
×1.2), **Red** Chomp (tint 0.6 s, lunge 200 px, ×1.8), **Piercing** Tongue Sweep (sweep(180°, 1.2 s)
r 180, ×1.0). Drops the chest's loot plus one extra roll from the Mimic row of CONTENT_ITEMS §3.

**Gary** (wandering merchant). 1,000,000 HP, does not attack. If attacked three times he says "Alright
then." and leaves for the rest of the playthrough. Sells nothing again. Drops nothing if somehow killed.

---

## 11. Bosses

Common rules (GAME_DESIGN §7): base HP 1800 at zone 1 scaling (so the Caretaker has 1800, Mother Spore
1800 × 1.55, etc., then NG+ and co-op multipliers); phase 2 at 50% HP (The Landlord: 66% / 33%);
transition: 2 s invulnerable animation; phase 2 = +20% speed, +25% damage, 2 new attacks, listed old
attacks upgraded. Damage multipliers are of the Boss base hit (45 at zone 1). Attack cooldowns are
roughly 4–12 s; the boss picks by weighted distance, never repeating the same attack twice in a row.

### Boss 1 — The Caretaker (Mossy Crypt)

A hulking gravedigger with a lantern and a shovel the size of a door. Arena: open crypt with 4 pillars
and 6 open graves (holes you cannot walk over).

Phase 1:
- **Shovel Swing**: cone(120°, 140), windup 0.9 s, ×1.2. *Parryable.*
- **Lantern Toss [PIERCE]**: circle(120) at the target, telegraph 1.0 s, ×1.3 Fire, leaves a fire puddle 4 s.
- **Grave Call**: 2 Shamblers climb out of random graves (max 4 alive).
- **Overhead Slam [RED]**: tint 0.7 s, line(90, 200), ×1.8, shockwave ring(90, 200) ×0.6 behind it.
- **Dirt Sweep [AREA]**: sweep(180°, 1.5 s) cone r 320, ×0.8, Blind 1 s.

Phase 2 (lantern breaks, moss ignites, he moves faster):
- New **Grave Quake [PIERCE][AREA]**: expandingRing(320 px/s) from him with 2 gaps, telegraph 1.0 s, ×1.2.
- New **Hands of the Dead [PIERCE][AREA]**: randomCircles(8, 70) hands grab for 1.5 s (root) ×0.6, telegraph 1.0 s.
- Lantern Toss now throws 3 lanterns. Grave Call summons 3.

### Boss 2 — Mother Spore (Fungal Caverns)

A cathedral-sized mushroom with a face in the stalk. Mostly stationary at the arena center; the fight
is about the floor. Arena: circular cave, 3 glowing pools (standing in one cures Poison but slows you).

Phase 1:
- **Stalk Slam**: circle(110) in front, windup 0.8 s, ×1.3.
- **Spore Bloom [PIERCE][AREA]**: grid(150, 55) pulsing twice, telegraph 1.2 s, ×0.8 + Poison 30.
- **Tendril Whip [RED]**: tint 0.6 s, line(50, 420) toward the target, ×1.5.
- **Sporeling Birth**: 3 Sporelings.
- **Gas Vent [AREA]**: cone(90°, 400) poison cloud 5 s (Poison 30/s inside), rotates 90° each use.

Phase 2 (cap splits open, the arena dims, spores fall):
- New **Rain of Caps [PIERCE][AREA]**: lanes(5, 64) horizontal, telegraph 1.2 s, ×1.2, two alternating sets 1.0 s apart (D94; was lanes(6, 80), which left no gap a body fits in).
- New **Uproot [RED][AREA]**: she lifts and slams down at the target: circle(200) ×2.0, tint 1.0 s; then she is **staggered 3 s** (punish window).
- Spore Bloom grid is tighter (120). Sporeling Birth spawns 5.

### Boss 3 — The Bloatking (Drowned Sewers)

A bloated drowned monarch on a floating throne of debris. Arena: flooded hall with 5 raised grates (safe
from waves). Water: everyone −15% speed off grates.

Phase 1:
- **Scepter Swing**: cone(100°, 130), windup 0.7 s, ×1.2. *Parryable.*
- **Wave [PIERCE][AREA]**: wave(140, 340 px/s) from one wall, telegraph 1.2 s, ×1.4, knockback.
- **Royal Decree [RED]**: tint 0.7 s, throne charges line(110, 400) ×1.6.
- **Summon Court**: 2 Drowned + 1 Green Slime.
- **Belch [AREA]**: cone(70°, 350) Poison cloud 4 s.

Phase 2 (throne sinks, he swims; grates become the only ground, waves come from two sides):
- New **Crosswave [PIERCE][AREA]**: two waves from perpendicular walls 0.8 s apart, from the sides every player can still reach a grate from (D94).
- ~~Drowning Grasp [RED]~~: removed (D212).
- Belch now leaves puddles. Summon Court adds a Rat Physician.

### Boss 4 — Vexthorn, the Hollow Stag (Hollow Forest)

A fey stag with antlers of thorn and a hollow chest with a lantern-heart. Fast. Arena: forest clearing
with 5 trees (destructible by its charge, each absorbs one charge).

Phase 1:
- **Antler Gore**: cone(90°, 150), windup 0.6 s, ×1.3, Bleed 30. *Parryable.*
- **Charge [RED][AREA]**: tint 0.8 s, line(100, room) wall to wall ×1.9; hitting a tree stops him (stagger 2 s).
- **Thorn Burst [PIERCE]**: circle(160) around him, telegraph 0.9 s, ×1.2, thorns 3 s.
- **Fey Lights**: 3 Will-o-Wisp-like lights that home slowly and pop (circle(60) ×0.6).
- **Hex Gale [AREA]**: cone(120°, 500) wind 2 s pushing players 150 px/s, ×0.3/s.

Phase 2 (heart-lantern flares; antlers extend; the clearing's edges grow thorn walls that deal ×0.5 on touch):
- New **Root Lines [PIERCE][AREA]**: 5 line(50, room) roots from him at random angles, telegraph 1.2 s, ×1.3, persist 3 s.
- New **Triple Charge [RED][AREA]**: three charges in a row, each re-aimed, 0.5 s between.
- Fey Lights spawn 5. Thorn Burst radius 220 with telegraph 1.1 s.

### Boss 5 — Foreman Ignatius (Ashen Forge)

A fire-cult blacksmith riding an Anvil Golem's shoulders; the two share a bar. Arena: forge floor with a
lava channel crossing the middle (2 bridges), bellows on the walls.

Phase 1:
- **Golem Slam**: circle(120), windup 0.9 s, ×1.4.
- **Hammer Throw [PIERCE]**: circle(110) at the target, telegraph 1.0 s, ×1.3 Fire, hammer returns along line(40) ×0.8 (second hit).
- **Forge Strike [RED]**: tint 0.7 s, line(90, 200) ×1.8 Fire.
- **Flame Pillars [PIERCE][AREA]**: grid(150, 55) checkerboard sets A/B, telegraph 1.0 s each, ×1.1 Fire.
- **Stoke**: bellows fire: two line(60, room) jets from the walls for 3 s, ×0.5/0.25 s + Burn.

Phase 2 (Ignatius is knocked off; the Golem goes molten and Ignatius fights on foot too: two targets, one bar):
- New **Molten Shockwave [PIERCE][AREA]**: expandingRing(300 px/s) from the Golem, gap behind it (or the nearest open side when his back is to a wall, pillar or lava), ×1.3, telegraph 1.2 s, only within 200 px (D94).
- New **Immolation [RED][AREA]**: Ignatius: tint 1.0 s, room-wide burst ×2.5 Fire except within 140 px of **him** (run to the priest rule); unblockable, so being in the pocket is the only answer.
- Flame Pillars sets come 0.5 s apart. Lava channel widens (one bridge left).

### Boss 6 — Saint Aurelia the Unthawed (Frozen Reliquary)

A knight-saint in a block of ice that cracks as the fight goes on. Arena: reliquary nave with 6 pillars;
floor ices over in patches.

Phase 1:
- **Blessed Blade** combo: 3 arcs ×1.0/×1.0/×1.4 Frost, Chill 20 each, reach 190 (D223; was 135). *Parryable (every hit, D223; was the third only).*
- **Ice Spears [PIERCE][AREA]**: lanes(5, 80) vertical, telegraph 1.1 s, ×1.2 Frost.
- **Frostbite Lunge [RED]**: tint 0.6 s, line(50, 260) ×1.7 Frost, Chill 70.
- **Hymn [PIERCE][AREA]**: expandingRing(280 px/s) 2 gaps, ×0.6 + Silence 2 s.
- **Mirror of Faith**: 3 ice mirrors that reflect projectiles and spells back and (D225) float about the room on their own. D222: real enemies (role hazard, HP ×1.2, about 360 in the first playthrough), each with **Frost Glint** (a ranged shot, Chill 20) and **Shatter** (circle(110) around itself, ×1.2, Chill 30, for anyone breaking it up close).

Phase 2 (the ice shatters: she is faster, wings of frost; D224: no ice patches any more):
- New **Avalanche [PIERCE][AREA]**: lanes(4, 120) boulders roll horizontally, telegraph 1.2 s, ×1.5.
- New **Judgment [RED][AREA]**: tint 0.9 s, she dives along line(120, room) through the target ×2.2 Frost, then a Frost Nova expandingRing ×1.0 [PIERCE] (two attacks chained; the ring has 3 gaps).
- Ice Spears fire in two sets. Hymn rings come in pairs.

### Boss 7 — Archmagister Tock (Clockwork Citadel)

A clockwork mage on a floating gear platform with 4 turrets in the corners of the arena. Arena: square
with a central rotating floor ring (moves you 40 px/s if you stand on it).

Phase 1:
- **Arcane Volley**: 5 bolts in a fan ×0.8 Void each.
- **Laser Sweep [PIERCE][AREA]**: one corner turret sweeps 360° in 3 s, ×1.0/0.25 s; telegraph shows the turret and direction.
- **Time Bubble [PIERCE][AREA]**: 3 circle(140) slow zones 6 s.
- **Gear Dash [RED]**: tint 0.7 s, platform rams line(110, 380) ×1.6.
- **Tin Reinforcements**: 4 Tin Soldiers march in.

Phase 2 (he rewinds the clock: the arena floor ring reverses, two turrets sweep at once opposite ways):
- New **Rewind Volley [PIERCE][AREA]**: 8 circle(90) strikes at every player's positions from 1.0 s ago, repeated 3 times at 0.7 s intervals.
- New **Overclock [RED]**: tint 0.8 s, 4 Gear Dashes in a row re-aimed each time.
- Laser Sweep uses 2 turrets. Time Bubbles last 10 s.

### Boss 8 — The Landlord (The Abyss, final, 3 phases)

The thing that owns the dungeon. A tall, suited silhouette with a face of static. Arena: a black
platform floating in void; edges have no walls (falling off = 50% of max HP and 1.5 s to climb back at
the nearest edge point; the fall cannot be dodged).

Phase 1 — **The Interview** (100% → 66%): humanoid, slow and heavy.
- **Briefcase Swing**: cone(110°, 160), windup 0.8 s, ×1.3. *Parryable.*
- **Eviction Notices**: 6 homing papers ×0.6 Void.
- **Void Cleave [RED][AREA]**: tint 0.8 s, line(120, room) ×2.0 Void.
- **Audit [PIERCE][AREA]**: pockets(3) r 120, telegraph 1.6 s, ×1.6 Void.
- **Late Fee**: summons 2 Landlord's Clerks (max 2).

Phase 2 — **The Eviction** (66% → 33%): the platform **shrinks by 25%**, he grows, sprouts 4 arms, +20% speed, +25% damage.
- New **Four-Arm Flurry [RED]**: tint 0.7 s, 4 rapid cones ×0.9 each rotating 90° each hit (a full circle).
- New **Gaze Beams [PIERCE][AREA]**: 2 tracking line(30, room) beams rotating opposite ways for 4 s.
- New **Supernova [PIERCE][AREA]**: pockets(2) r 110, telegraph 1.8 s, ×2.6 Void.
- Audit now has 2 pockets. Void Cleave comes as a cross (two lines).

Phase 3 — **The Deep Lease** (33% → 0): he becomes a void form filling the far third of the platform
(stationary, a huge face); the platform shrinks again (−25%); +40% speed on projectiles, +50% damage;
**Hollow Joes** (2 at a time) spawn.
- New **Maw [PIERCE]**: constant pull 70 px/s toward the face (pauses in the last 0.2 s of a bite telegraph); circle(220) bite around the face every 6 s, telegraph 1.5 s, ×2.5.
- New **Foreclosure [RED][AREA]**: tint 1.2 s, everything within 60° of the face's gaze cone(60°, room) ×3.0; the cone turns 120° between uses (telegraphed sweep arrow).
- New **Collapse [PIERCE][AREA]**: the platform's outer ring (ring(220, edge)) falls away for 4 s, telegraph 1.5 s; standing on it = fall.
- Supernova now has 1 pocket. Eviction Notices come in 10s. Gaze Beams persist.

Beating The Landlord: the lease ends, the stairs go up, credits, NG+ bonfire.

---

## 12. Elite affix visuals

Frenzied (red speed lines) · Armored (grey plates) · Vampiric (dark red aura, heal numbers) · Arcane
(3 violet orbs orbiting, Piercing on touch ×0.5) · Molten (orange trail) · Frostbound (blue aura
r 120, Chill 20/s) · Shielded (cyan bubble) · Summoner (green rune circle).

## 13. Validation tests the build must include (data-driven)

1. Every enemy has exactly one normal attack and one or two specials, and at least one special is Red or
   Piercing (the rest are `utility`).
2. No attack is both Red and Piercing.
3. Every zone has ≥ 2 Red users and ≥ 2 Piercing users among its 10, so any mix can satisfy the mix rule;
   the generator's mix-picker is tested to always produce a valid mix.
4. Every Piercing pattern passes the escapability rule of GAME_DESIGN §5.6 (telegraph, pull, gaps,
   lane width, pocket reach or an attack `condition`). Every Piercing `expandingRing` declares ≥ 1 gap. Lanes
   and grids leave a gap of ≥ 32 px (a body). **Every boss attack is walked (D94)**: `tests/unit/bossEscape.test.ts`
   resolves each boss's Piercing and ticking patterns in its real arena, every phase (moving floors, flood, pull,
   lava and the shrunk platform included), from starts around two boss spots, and steps the set of cells a
   walking player could stand on through time; it must never empty.
5. Every boss has ≥ 1 Red, ≥ 1 Piercing, ≥ 2 [AREA] attacks, a phase-2 table (phase 3 for The Landlord).
6. Shard tuning target from GAME_DESIGN §2.3 holds for every zone within ±20%.
7. Every status or control effect named in a table exists in `StatusId` / `ControlId`; every zone's
   immunities are declared with `statusImmune`.
