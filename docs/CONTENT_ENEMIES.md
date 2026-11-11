# Dungeon Joe — Enemies and Bosses

The current catalogue of every enemy and boss, generated from `src/data/enemies/*`, `src/data/bosses/*`,
`src/data/roles.ts` and `src/data/zones.ts` (v1.3.19). The data files are the truth; if this page and the data
disagree, the data wins and this page is out of date. Mechanics (telegraphs, Red and Piercing, poise, statuses) are in
[GAME_DESIGN.md](GAME_DESIGN.md); pattern primitives in GAME_DESIGN §5.7.

80 roster enemies (10 per zone), Elite variants, 8 bosses (with New Game+ third phases), boss parts and summons, the
tutorial Instructor, the Mimic and Gary.

## 1. Reading this page

**Role base stats** (zone 1, first playthrough, solo). A row's own `mult` and `speed` override these. Room enemies'
poise comes from their size (0.05 × radius², D78); the role poise is used only by bosses.

| Role | HP | Hit | Move px/s | Poise | Shards | Radius | Threat cost |
|---|---|---|---|---|---|---|---|
| Fodder (`fodder`) | 60 | 18 | 150 | 0 | 20 | 18 | 2 |
| Swarm (`swarm`) | 18 | 8 | 240 | 0 | 5 | 9 | 3 |
| Ranged (`ranged`) | 50 | 20 | 130 | 10 | 25 | 17 | 3 |
| Caster (`caster`) | 55 | 22 | 110 | 10 | 30 | 17 | 4 |
| Support (`support`) | 55 | 22 | 110 | 10 | 30 | 17 | 4 |
| Brute (`brute`) | 180 | 40 | 110 | 60 | 70 | 30 | 6 |
| Assassin (`assassin`) | 70 | 28 | 170 | 15 | 40 | 16 | 4 |
| Tank (`tank`) | 150 | 26 | 120 | 80 | 60 | 24 | 5 |
| Hazard (`hazard`) | 80 | 20 | 90 | 20 | 40 | 20 | 4 |
| Mimic (`mimic`) | 220 | 45 | 200 | 70 | 100 | 22 | 6 |
| Boss (`boss`) | 3600 | 45 | 140 | 200 | 1200 | 56 | 0 |

**Scaling.** Enemy HP and damage grow by zone and New Game+ cycle (GAME_DESIGN §2.3): zone curves, ×4.5 HP and ×1.4
damage at NG+1, then the NG step per cycle (D259), plus the per-zone damage factor (zone 4 ×1.1, 5–6 ×1.15, 7 ×1.35,
D231) and, from NG+1, the room-enemy damage ramp by zone (zone 2 ×2 … zone 8 ×1.65, D275, D287; bosses excluded).
Co-op adds HP per extra player (+125% for bosses and Elites, +75% for the rest, D159).

**Columns.**
- **HP (1st / NG+1)**: the enemy's max HP solo in its own zone on the first playthrough and at NG+1.
- **Attacks**: every attack the enemy has, normal attack first. The number in brackets after the damage multiplier
  is the hit before defense, solo, first playthrough, in its own zone. A combo shows each hit's multiplier and the
  biggest hit.
- `[RED]` = unblockable and unparryable, dodge it (red tint). `[PIERCE]` = Piercing: ignores i-frames, walk out of
  the floor area (blue). `[AREA]` = covers a large part of the room. No attack is both Red and Piercing.
- **tell** = the Red tint or Piercing telegraph before the hit; **windup** = a normal attack's windup. **cd** =
  cooldown in seconds. `trigger` attacks are not chosen by the AI; they fire on their condition (on hit, below an HP
  share, on death…).
- Patterns: `arc(θ, r)`, `thrust(w, l)`, `line(w, l)`, `cone(θ, r)`, `circle(r) at …`, `ring(in, out)`,
  `proj(speed)`, `lanes(n, w)`, `grid(spacing, r)`, `sweep(θ, time) r`, `expandingRing(speed) gaps`,
  `randomCircles(n, r)`, `wave(w, speed)`, `beam(w, l)`, and "room-wide, n safe pockets r".
- Zone resistances in each zone header apply to every enemy of the zone and its boss, on top of an enemy's own.

## 2. Zone 1 — Mossy Crypt

Zone resistances (every enemy and the boss): no zone resistances.

| Enemy | Role | HP (1st / NG+1) | Movement | Attacks | Traits | Flavor |
|---|---|---|---|---|---|---|
| **Shambler** | Fodder, r 18 | 60 / 1227 | walk, keeps 40 px | **Claw Swipe**: arc(70°, 50), ×1 physical (18), windup 0.5 s, cd 1.2<br>**Grave Lunge [RED]**: line(40, 160), lunges 160 px, ×1.4 physical (25), tell 0.6 s, cd 6 | packs of 4–6; undead | Still owes rent. |
| **Bone Archer** | Ranged, r 17 | 50 / 1023 | circle, keeps 420 px | **Arrow**: proj(420), ×1 physical (20), windup 0.45 s, cd 1.6<br>**Rain of Bones [PIERCE] [AREA]**: randomCircles(5, 70), ×0.8 physical (16), tell 1 s, cd 9 | undead | No skin in the game. Flinches anyway. |
| **Crypt Rat Swarm** | Swarm, r 9 | 18 / 368 | swarm, keeps 30 px | **Nibble**: arc(100°, 24), ×1 physical (8), windup 0.2 s, cd 0.4<br>**Frenzy [RED]**: line(24, 150), lunges 150 px, ×1 physical (8), tell 0.6 s, cd 7<br>**Scatter**: scatter, trigger: onHit | 6 pieces | Six rats in a trench coat, minus the coat. |
| **Gravedigger** | Brute, r 30 | 180 / 3681 | walk, keeps 70 px | **Shovel Overhead**: thrust(50, 90), ×1.2 physical (48), windup 0.8 s, cd 2.2, hyper armor<br>**Dirt Toss [RED]**: cone(90°, 220), ×0.9 physical (36), blind 1.5 s, tell 0.78 s, cd 8<br>**Grave Quake [PIERCE] [AREA]**: expandingRing(300 px/s) 4 gaps of 90 (one toward the centre), ×1 physical (40), tell 1 s, cd 12 | hyper armor; undead | Digs one more than he needs. Just in case. |
| **Will-o-Wisp** | Caster, r 14 | 55 / 1125 | hover, keeps 250 px | **Spark Bolt**: proj(240, homing), ×0.9 fire (20), windup 0.5 s, cd 2<br>**Soul Flare [PIERCE]**: circle(130) at target, flies to the target, ×1.6 fire (35), tell 1.2 s, cd 10<br>**Blink**: teleports 300 px (random), trigger: onHitTwice | lights the room; holy weak 100% | Takes double from Holy. Takes everything personally. |
| **Hollow Knight** | Tank, r 22 | 150 / 3068 | walk, keeps 60 px | **Sword Combo**: arc(90°, 72), ×0.9/×0.9/×1.3 physical (34), windup 0.55 s, cd 3<br>**Shield Charge [RED]**: line(60, 260), lunges 260 px, ×1.5 physical (39), tell 0.6 s, cd 9 | front guard 80%; undead | Paid his last Glowen in rent. The armour stayed on out of habit. |
| **Ghoul Leaper** | Assassin, r 16 | 70 / 1432 | circle, keeps 300 px | **Double Slash**: arc(100°, 56), ×0.8/×0.8 physical (22), bleed 25, windup 0.32 s, cd 1.8<br>**Pounce [RED]**: circle(60) at target, leaps, ×1.6 physical (45), bleed 25, tell 0.6 s, cd 7<br>**Mist Step**: invulnerable 1.5 s; teleports 0 px (behindTarget), trigger: hpBelow 0.3 | undead | Smiles with too many teeth. Uses all of them. |
| **Plague Bell** | Hazard, r 20 | 80 / 1636 | stationary | **Chime**: ring(0, 90), ×0.95 void (19), windup 0.5 s, cd 3<br>**Toll [PIERCE] [AREA]**: 3× expandingRing(220 px/s) 4 gaps of 90 (one toward the centre), 1.2 s apart, ×1.15 void (23), tell 1 s, cd 14<br>**Raise Dead**: raises a fallen ally at 50% HP (max 2, 2 s channel), windup 0.3 s, cd 8, only if deadAllies |  | Tolls for the dead, who take it as an alarm clock. Kill it first. |
| **Weeping Mourner** | Support, r 17 | 55 / 1125 | hover, keeps 280 px | **Teardrop**: proj(260, homing), ×0.9 void (20), windup 0.55 s, cd 2.2<br>**Wail [PIERCE]**: cone(70°, 240), ×0.6 void (13), silence 2 s, tell 1 s, cd 10<br>**Lament**: heal 25% over 2 s (ally), windup 0.4 s, cd 9, only if injuredAlly | undead | Cried at the reading of the will. Was not in it. |
| **Pallbearer** | Brute (speed 100), r 28 | 180 / 3681 | walk, keeps 70 px | **Coffin Swing**: arc(120°, 90), ×1.2 physical (48), windup 0.8 s, cd 2.4, hyper armor<br>**Committal [RED]**: line(60, 120), ×0.6 physical (24), grab: held 1.4 s, ×3 on release, tell 0.65 s, cd 13, hyper armor | hyper armor; undead | Has carried the same coffin for three hundred years. Still looking for a tenant. |

## 3. Zone 2 — Fungal Caverns

Zone resistances (every enemy and the boss): fire weak 35%; immune to poison.

| Enemy | Role | HP (1st / NG+1) | Movement | Attacks | Traits | Flavor |
|---|---|---|---|---|---|---|
| **Sporeling** | Fodder (speed 120), r 16 | 93 / 1267 | walk, keeps 30 px | **Headbutt**: circle(40) at self, ×1 physical (24), windup 0.5 s, cd 1.4<br>**Spore Puff [PIERCE]**: circle(70) at self, ×0.5 physical (12), poison 40, tell 0.8 s, cd 6<br>**Spore Burst**: poisonCloud circle(90) at self for 4 s, trigger: onDeath | packs of 5–5 | Killing them in melee is a choice. |
| **Cave Hound** | Fodder (HP ×1.2, speed 220), r 18 | 112 / 1521 | flank, keeps 110 px | **Bite**: arc(70°, 50), ×1 physical (24), windup 0.35 s, cd 1.2<br>**Lunge [RED]**: line(40, 200), lunges 200 px, ×1.3 physical (32), tell 0.6 s, cd 5 | packs of 3–3 | Three dogs, one brain cell. They take turns with it. |
| **Myconid Shaman** | Caster (speed 90), r 17 | 85 / 1162 | walk, keeps 300 px | **Spore Bolt**: proj(300), ×0.9 magic (27), poison 20, windup 0.55 s, cd 2<br>**Spore Bloom [PIERCE] [AREA]**: grid(160, 55), 3 pulses, ×0.7 magic (21), tell 1.2 s, cd 12<br>**Mend**: heal 25% over 2 s (ally), windup 0.4 s, cd 8, only if injuredAlly |  | A caster with a hat. The hat is load-bearing. |
| **Boulder Beetle** | Tank (speed 100), r 26 | 233 / 3168 | walk, keeps 50 px | **Mandible Bite**: arc(80°, 62), ×1.1 physical (39), windup 0.6 s, cd 2<br>**Roll [RED] [AREA]**: line(80, room), charges to the wall, bounces 1, ×1.4 physical (49), tell 0.6 s, cd 10 | shell: front ×0.3 until flipped (4 s exposed ×2) | Rolls wall to wall, then once more out of spite. |
| **Glowcap Spitter** | Ranged, r 17 | 78 / 1056 | walk, keeps 380 px | **Acid Glob**: circle(50) at target, leaves acid 5 s, ×0.8 physical (22), windup 0.8 s, cd 2.4<br>**Acid Rain [PIERCE] [AREA]**: randomCircles(8, 60), leaves acid 5 s, ×0.6 physical (16), tell 1 s, cd 11 |  | Spits acid, leaves puddles, never mops. Cull it early. |
| **Fungal Ogre** | Brute (speed 90), r 32 | 279 / 3802 | walk, keeps 70 px | **Club Smash**: circle(80) at target, ×1.2 physical (65), windup 0.9 s, cd 2.4, hyper armor<br>**Ground Pound [PIERCE] [AREA]**: ring(0, 240), ×1.3 physical (70), knockback 180, tell 1.2 s, cd 9, hyper armor<br>**Grab [RED]**: line(60, 110), ×0.5 physical (27), grab: held 1.5 s, ×4 on release, tell 0.6 s, cd 14, hyper armor | hyper armor | Mostly mushroom. Won’t flinch. Mushrooms rarely do. |
| **Spore Bat** | Swarm, r 10 | 28 / 380 | swarm, keeps 30 px | **Swoop**: line(26, 110), lunges 110 px, ×1 physical (11), windup 0.35 s, cd 1.6<br>**Screech [PIERCE]**: cone(60°, 140), ×0.5 physical (5), hold 0.4 s, tell 0.8 s, cd 8 | 4 pieces | Has never flown in a straight line. Sees no reason to start. |
| **Mycelium Weaver** | Hazard, r 22 | 124 / 1690 | stationary | **Tendril Whip**: line(30, 200), ×0.9 physical (24), windup 0.6 s, cd 2.2<br>**Lay Lines [AREA]**: tendril 3× line(18, room) at random angles for 8 s, ×0.5 physical (14), windup 0.7 s, cd 10<br>**Lash [PIERCE] [AREA]**: 3× line(34, room), every tendril pulses ×1 physical, ×1 physical (27), tell 1 s, cd 12 |  | Knits the floor together. Badly, on purpose. |
| **Lanternjaw** | Assassin, r 16 | 109 / 1478 | flank, keeps 140 px | **Snap**: arc(80°, 60), ×0.7/×0.9 physical (34), bleed 20, windup 0.38 s, cd 1.8<br>**Lure Lunge [RED]**: circle(64) at target, leaps, ×1.7 physical (64), tell 0.65 s, cd 8 | invisible beyond 220 px | Carries its own lamp. You are not the first moth. |
| **Lichen Hermit** | Support (speed 90), r 18 | 85 / 1162 | walk, keeps 300 px | **Pipe Puff**: proj(240), ×0.8 physical (24), poison 20, windup 0.6 s, cd 2.4<br>**Smoke Rings [PIERCE] [AREA]**: 2× expandingRing(240 px/s) 4 gaps of 90 (one toward the centre), 1.2 s apart, ×0.6 physical (18), poison 30, tell 1 s, cd 13<br>**Lichen Coat**: barrier 20% max HP 10 s (ally), windup 0.6 s, cd 10, only if hasAlly |  | Has sublet the same cave for sixty years. Pays the rent in moss. |

## 4. Zone 3 — Drowned Sewers

Zone resistances (every enemy and the boss): no zone resistances; immune to poison.

| Enemy | Role | HP (1st / NG+1) | Movement | Attacks | Traits | Flavor |
|---|---|---|---|---|---|---|
| **Drowned** | Fodder (speed 110), r 18 | 126 / 1309 | walk, keeps 36 px | **Slap**: arc(80°, 52), ×1 physical (31), windup 0.55 s, cd 1.4<br>**Drowning Hug [RED]**: circle(45) at self, ×0.5 physical (15), grab: held 1.2 s, ×3 on release, −30 stamina, tell 0.6 s, cd 7 | packs of 4–6; undead | Just wants a hug. A long one. Underwater. |
| **Green Slime** | Fodder (HP ×0.8, speed 140), r 17 | 101 / 1047 | walk, keeps 60 px | **Bounce**: circle(34) at target, leaps, ×0.9 physical (28), windup 0.45 s, cd 1.6<br>**Split**: splits into 2 Green Slime, trigger: onDeath<br>**Burst [PIERCE]**: circle(100) at self, ×1.1 physical (34), poison 40, tell 0.9 s, cd 8 |  | Two for the price of one. Then four for the price of none. |
| **Sewer Crocodile** | Brute (speed 110), r 30 | 378 / 3926 | burrow, keeps 60 px | **Snap**: arc(50°, 80), ×1.3 physical (88), windup 0.55 s, cd 1.8, hyper armor<br>**Death Roll [RED]**: circle(90) at target, leaps, ×2 physical (136), tell 0.6 s, cd 11, hyper armor<br>**Tail Sweep [AREA]**: sweep(360°, 0.8 s) r 150, ×1 physical (68), windup 0.7 s, cd 7, hyper armor | hyper armor; submerged (takes 50%) | The rumours were true. The rumours were also hungry. |
| **Rat Physician** | Caster (speed 130), r 16 | 116 / 1200 | circle, keeps 320 px | **Vial Toss**: circle(60) at target, leaves acid 6 s, ×0.6 physical (22), windup 0.8 s, cd 2.6<br>**Miasma [PIERCE] [AREA]**: room-wide, 3 safe pockets r 110, ×0.9 physical (34), tell 1.5 s, cd 16<br>**Prescribe**: buff damagePct +0.3 for 8 s (ally), windup 0.5 s, cd 10, only if hasAlly |  | Not that kind of doctor. Or any kind. |
| **Harpooner** | Ranged, r 17 | 105 / 1091 | walk, keeps 400 px | **Harpoon**: proj(520), ×1 physical (34), windup 0.6 s, cd 2, parryable<br>**Reel [RED]**: line(24, 450), ×1.4 physical (48), pulls 900 px/s, tell 0.6 s, cd 10 |  | Fishes for people. Throws nothing back. |
| **Leech Swarm** | Swarm, r 8 | 38 / 393 | swarm, keeps 20 px | **Attach**: arc(120°, 22), ×0.6 physical (8), windup 0.25 s, cd 1<br>**Leap [RED]**: circle(30) at target, leaps, ×0.8 physical (11), tell 0.6 s, cd 6 | 5 pieces; Burn kills it | Drinks Glowen straight from the tap. Joe is the tap. |
| **Bloated Carrier** | Hazard (HP ×1.3, speed 70), r 26 | 218 / 2269 | walk, keeps 40 px | **Slap**: circle(50) at self, ×0.8 physical (27), windup 0.6 s, cd 1.8<br>**Detonate [PIERCE] [AREA]**: circle(150) at self, die, ×2 physical (68), poison 60, tell 1.2 s, cd 10<br>**Birth**: summons 3 Leech Swarm (max 3), trigger: onDeath<br>**On death**: zone circle(150) at self for 1.2 s |  | Full to bursting. Kill it at range, or walk it into its friends. |
| **Tide Caller** | Caster, r 18 | 116 / 1200 | stationary | **Water Bolt**: proj(340), ×0.9 magic (34), windup 0.55 s, cd 2<br>**Wave [PIERCE] [AREA]**: wave(120, 320 px/s) from random, grates safe, 2 gaps, ×1.3 magic (49), knockback 160, tell 1.2 s, cd 11<br>**Flood**: room: flood 10 s, windup 0.9 s, cd 20, only if noFlood |  | Calls the tide. The tide always picks up. |
| **Sewer Diver** | Tank (speed 95), r 24 | 315 / 3272 | walk, keeps 60 px | **Wrench**: arc(90°, 72), ×1/×1.2 physical (53), windup 0.6 s, cd 2.6<br>**Anchor Drop [RED]**: circle(80) at target, ×1.6 physical (71), knockback 120, tell 0.8 s, cd 9 | front guard 60%; undead | Came down in 1874 to fix a leak. The leak won. |
| **Fuse Eel** | Assassin (speed 170), r 16 | 147 / 1527 | burrow, keeps 50 px | **Bite**: arc(70°, 56), ×1 magic (48), shock 20, windup 0.4 s, cd 1.6<br>**Live Wire [RED]**: line(36, 220), lunges 220 px, ×1.4 magic (67), tell 0.6 s, cd 7<br>**Discharge [PIERCE]**: circle(120) at self, ×1.3 magic (62), shock 50, tell 1 s, cd 9 | submerged (takes 50%) | Joe has found the fuse box. It has found Joe. |

## 5. Zone 4 — Hollow Forest

Zone resistances (every enemy and the boss): holy resist 20%, fire weak 40%.

| Enemy | Role | HP (1st / NG+1) | Movement | Attacks | Traits | Flavor |
|---|---|---|---|---|---|---|
| **Hollow Wolf** | Fodder (HP ×1.3, speed 240), r 17 | 198 / 1774 | flank, keeps 90 px | **Bite**: arc(70°, 52), ×1 physical (41), bleed 20, windup 0.38 s, cd 1.2<br>**Lunge [RED]**: line(40, 240), lunges 240 px, ×1.3 physical (53), tell 0.6 s, cd 5<br>**Pack Howl**: buff moveSpeedPct +0.15 for 5 s (party), trigger: firstSight | packs of 3–4 | Hollow inside. Hungry anyway. |
| **Thornling** | Fodder (HP ×0.7), r 14 | 107 / 955 | dash, keeps 40 px | **Scratch**: arc(80°, 44), ×0.8 physical (32), windup 0.4 s, cd 1.2<br>**Bramble Burst [PIERCE]**: circle(80) at self, leaves thorns 4 s, ×1 physical (41), tell 0.8 s, cd 7 | packs of 5–5 | A hedge with ambitions. |
| **Fey Archer** | Ranged, r 16 | 127 / 1137 | circle, keeps 420 px | **Curving Arrow**: proj(380, homing), ×1 magic (45), windup 0.5 s, cd 1.8<br>**Arrow Storm [PIERCE] [AREA]**: lanes(5, 90) vertical, two sets 0.8 s apart, ×0.9 magic (41), tell 1 s, cd 10 | blinks 150 px when approached | Every arrow takes the scenic route. Every arrow arrives. |
| **Treant** | Tank (HP ×1.5, speed 60), r 32 | 571 / 5118 | walk, keeps 70 px | **Branch Slam**: circle(90) at self, ×1.3 physical (76), windup 0.85 s, cd 2.6<br>**Root Slam [RED]**: line(70, 220), ×1.5 physical (88), tell 0.6 s, cd 9<br>**Root Lines [PIERCE] [AREA]**: 4× line(40, room) at random angles, leaves roots 3 s, ×1 physical (59), tell 1.2 s, cd 14 | Burn kills it; fire weak 100% | Tapped for its Glowen like a maple. Takes it out on visitors. |
| **Witch of the Glade** | Caster, r 16 | 140 / 1251 | teleport, keeps 300 px | **Hex Bolt**: proj(300), ×0.9 void (45), hexed 6 s, windup 0.55 s, cd 2.2<br>**Hex Circle [PIERCE]**: circle(140) at target, ×1.4 void (69), tell 1 s, cd 9<br>**Mirror**: 2 illusions for 12 s, windup 0.4 s, cd 16, only if hpBelow(99) | teleports every 6 s | Two of her are fake. The third one is also mostly fake. |
| **Stag Sentinel** | Brute (speed 130), r 28 | 457 / 4095 | walk, keeps 90 px | **Antler Sweep**: arc(120°, 110), ×1.1 physical (99), windup 0.7 s, cd 2.4<br>**Charge [RED] [AREA]**: line(90, room), charges to the wall, stunned 1.5 s on the wall, ×1.8 physical (162), tell 0.8 s, cd 10, hyper armor |  | Guards the forest. Mostly from walls. |
| **Pixie Swarm** | Swarm, r 8 | 46 / 409 | swarm, keeps 30 px | **Poke**: arc(90°, 22), ×1.1 physical (20), windup 0.22 s, cd 0.6<br>**Flash [PIERCE]**: cone(90°, 160), ×0.6 holy (11), blind 1.5 s, tell 0.8 s, cd 9 | 5 pieces | Small, bright and rude. Check your pockets. |
| **Hollow Huntsman** | Assassin, r 16 | 178 / 1592 | circle, keeps 260 px | **Knife**: arc(80°, 54), ×1 physical (63), windup 0.35 s, cd 1.4<br>**Backstab [RED]**: thrust(50, 90), appears behind the target, ×2.2 physical (139), tell 0.6 s, cd 12<br>**Trap**: bearTrap randomCircles(1, 22) within 140 for 24 s, ×1 physical (63), root 1.5 s, windup 0.5 s, cd 8 |  | Hunts anything that moves. Traps anything that doesn’t. |
| **Hollow Scarecrow** | Hazard, r 20 | 203 / 1820 | stationary | **Crow**: proj(280, homing), ×0.8 physical (36), windup 0.5 s, cd 2.2<br>**Murder of Crows [PIERCE] [AREA]**: randomCircles(7, 60), ×0.8 physical (36), tell 1 s, cd 11 | Burn kills it | Scares nothing. The crows are on its payroll. |
| **Beekeeper** | Support (speed 100), r 17 | 140 / 1251 | walk, keeps 300 px | **Bee Line**: 3× proj(300, homing) in a 30° fan, ×0.5 physical (25), poison 15, windup 0.55 s, cd 2.4<br>**Kicked Hive [PIERCE]**: circle(110) at target, leaves poisonCloud 4 s, ×1.2 physical (60), poison 40, tell 1 s, cd 10<br>**Royal Jelly**: buff damagePct +0.3 for 8 s (ally), windup 0.5 s, cd 10, only if hasAlly |  | Pays the rent in honey. The Landlord is allergic. |

## 6. Zone 5 — Ashen Forge

Zone resistances (every enemy and the boss): no zone resistances; immune to burn.

| Enemy | Role | HP (1st / NG+1) | Movement | Attacks | Traits | Flavor |
|---|---|---|---|---|---|---|
| **Cinder Cultist** | Fodder, r 17 | 178 / 1428 | walk, keeps 40 px | **Fire Dagger**: arc(70°, 50), ×1 fire (50), burn 20, windup 0.45 s, cd 1.3<br>**Fire Dash [RED]**: line(40, 180), leaves firePuddle 2 s, lunges 180 px, ×1.2 fire (60), tell 0.6 s, cd 7<br>**Self-Immolation**: firePuddle circle(70) at self for 4 s, trigger: onDeath | packs of 4–4 | Joined a fire cult. It turned out to be a zero-hours contract. |
| **Forge Hound** | Fodder (HP ×1.2, speed 230), r 17 | 214 / 1714 | flank, keeps 80 px | **Bite**: arc(70°, 50), ×1 fire (50), windup 0.38 s, cd 1.2<br>**Lunge [RED]**: line(40, 200), lunges 200 px, ×1.3 fire (65), tell 0.6 s, cd 5<br>**Fire Trail**: firePuddle circle(24) at self for 3 s, trigger: passive | packs of 3–3 | Nine hundred degrees of dog. Do not pet. |
| **Pyromancer** | Caster, r 17 | 163 / 1309 | circle, keeps 320 px | **Fireball**: proj(300) → circle(50) at self, ×1 fire (61), windup 0.6 s, cd 2.2<br>**Flame Pillars [PIERCE] [AREA]**: grid(140, 50) checkerboard, 2 sets 1 s apart, ×1.1 fire (67), tell 1 s, cd 12<br>**Fire Wall [AREA]**: 2× line(40, room), leaves fireWall 6 s, ×0.5 fire (30), burn 40, windup 1 s, cd 15 |  | Draws a line of fire across the room, then dares you. |
| **Anvil Golem** | Tank (HP ×1.3, speed 80), r 28 | 579 / 4642 | walk, keeps 60 px | **Hammer Slam**: circle(80) at self, ×1.4 physical (100), windup 0.9 s, cd 2.8<br>**Forge Strike [RED]**: line(80, 160), ×1.8 physical (129), tell 0.7 s, cd 9<br>**Molten Shockwave [PIERCE] [AREA]**: expandingRing(280 px/s) 3 gaps of 100 (one behind it) (one toward the centre), ×1.2 fire (86), tell 1 s, cd 12 | construct | Was an anvil. Got promoted. |
| **Slag Crawler** | Swarm (speed 120), r 10 | 53 / 428 | swarm, keeps 30 px | **Lava Touch**: arc(100°, 26), ×0.8 fire (18), windup 0.3 s, cd 0.8<br>**Erupt [PIERCE]**: circle(80) at self, ×1 fire (22), tell 0.8 s, cd 8<br>**Slag Trail**: slag circle(20) at self for 5 s, trigger: passive | 4 pieces | Low threat. Leaves the floor worse than it found it. |
| **Bellows Brute** | Brute, r 30 | 535 / 4285 | walk, keeps 80 px | **Bellows Punch**: thrust(50, 85), ×1.2 physical (132), windup 0.7 s, cd 2.2<br>**Flame Sweep [PIERCE] [AREA]**: sweep(180°, 2.4 s) r 300, tick 0.3 s, ×0.9 fire (99), tell 1 s, cd 14<br>**Grab-and-Burn [RED]**: line(60, 110), ×1 fire (110), grab: held 1.5 s, ×2 on release, tell 0.6 s, cd 14 |  | Breathes for the forge. Has never once been offered a mint. |
| **Ash Wraith** | Assassin, r 16 | 208 / 1666 | flank, keeps 300 px | **Ember Claw**: arc(90°, 52), ×1 fire (77), windup 0.35 s, cd 1.4<br>**Ember Strike [RED]**: line(50, 120), appears behind the target, ×1.8 fire (139), tell 0.6 s, cd 9<br>**Scatter**: 3× circle(40) at self ×0.5 fire; invulnerable 1.2 s; teleports 320 px (random), ×1 fire (77), windup 0.6 s, trigger: hpBelow 0.4 | invisible beyond 250 px; undead | What is left when the fire is done with you. |
| **Furnace Priest** | Support, r 18 | 163 / 1309 | stationary | **Ember Bolt**: proj(380), ×0.8 fire (49), windup 0.5 s, cd 2<br>**Immolation Nova [PIERCE] [AREA]**: room-wide, 1 safe pocket r 120 (self), ×2.5 fire (152), tell 2.2 s, cd 18, only if allPlayersWithin(500)<br>**Enrage**: room: enrage 8 s, windup 0.8 s, cd 15 |  | Preaches the dignity of labour. When it all goes up, hug the priest. |
| **Rivet Gunner** | Ranged, r 17 | 149 / 1190 | circle, keeps 400 px | **Hot Rivet**: proj(480), ×1 fire (55), burn 15, windup 0.45 s, cd 1.6<br>**Riveting [PIERCE] [AREA]**: randomCircles(6, 60), leaves slag 3 s, ×0.9 fire (50), tell 1 s, cd 10 |  | Paid by the rivet. Not fussy about where they go. |
| **Crucible Bearer** | Hazard (HP ×1.2, speed 80), r 22 | 285 / 2285 | walk, keeps 120 px | **Splash**: cone(60°, 140), leaves firePuddle 3 s, ×0.9 fire (50), windup 0.7 s, cd 2.8<br>**Tip the Crucible [PIERCE]**: cone(80°, 240), leaves slag 4 s, ×1.4 fire (77), burn 40, tell 1.1 s, cd 12 |  | The health and safety officer. Nobody asks what happened to the last one. |

## 7. Zone 6 — Frozen Reliquary

Zone resistances (every enemy and the boss): no zone resistances; immune to chill, freeze.

| Enemy | Role | HP (1st / NG+1) | Movement | Attacks | Traits | Flavor |
|---|---|---|---|---|---|---|
| **Frost Knight** | Tank, r 23 | 510 / 3721 | walk, keeps 60 px | **Sword Combo**: arc(90°, 74), ×0.9/×0.9/×1.2 magic (99), chill 15, windup 0.55 s, cd 3, parryable<br>**Frostbite Thrust [RED]**: line(40, 200), ×1.6 magic (132), chill 60, tell 0.6 s, cd 8 | front guard 70%; undead | Took a vow of eternal vigil. Regrets the 'eternal' part. |
| **Reliquary Wraith** | Caster, r 16 | 187 / 1364 | hover, keeps 300 px | **Frost Bolt**: proj(330), ×0.9 magic (63), chill 25, windup 0.5 s, cd 1.8<br>**Frost Nova [PIERCE] [AREA]**: expandingRing(320 px/s) 4 gaps of 90 (one toward the centre), ×1.2 magic (83), chill 50, tell 1 s, cd 11<br>**Haunt**: invulnerable 3 s, windup 0.15 s, cd 15, only if hpBelow(50) | undead | Haunts out of habit. The relics stopped noticing centuries ago. |
| **Icicle Lurker** | Assassin, r 16 | 238 / 1737 | ceiling, keeps 50 px | **Claws**: arc(100°, 56), ×1 physical (89), windup 0.38 s, cd 1.6<br>**Drop [PIERCE]**: circle(70) at target, leaps, ×1.8 magic (159), tell 0.75 s, cd 999<br>**Shatter [RED]**: circle(90) at self, ×1.4 magic (124), tell 0.6 s, cd 8 | packs of 2–3 | Look up. No, the other up. |
| **Frozen Hound** | Fodder (HP ×1.2, speed 230), r 18 | 245 / 1786 | flank, keeps 60 px | **Bite**: arc(70°, 48), ×1 magic (57), chill 20, windup 0.38 s, cd 1.2<br>**Lunge [RED]**: line(36, 200), lunges 200 px, ×1.3 magic (74), tell 0.6 s, cd 5 | packs of 3–3 | A good boy, preserved. Mostly the teeth. |
| **Choir Acolyte** | Support, r 17 | 187 / 1364 | stationary | **Hymn Bolt**: proj(360), ×0.95 holy (66), windup 0.5 s, cd 2<br>**Hymn of Silence [PIERCE] [AREA]**: expandingRing(260 px/s) 4 gaps of 90 (one toward the centre), ×0.8 holy (56), silence 2 s, tell 1 s, cd 12<br>**Choir Shield**: barrier 20% max HP 10 s (ally), windup 0.6 s, cd 10, only if hasAlly | packs of 2–2; undead | Four hundred years on one note. Still flat. |
| **Glacial Golem** | Brute (HP ×1.4, speed 70), r 32 | 856 / 6251 | walk, keeps 80 px | **Ice Smash**: circle(90) at self, ×1.4 magic (177), windup 0.9 s, cd 2.6<br>**Avalanche [PIERCE] [AREA]**: lanes(4, 110) vertical, leaves ice 3 s, ×1.5 physical (190), tell 1.2 s, cd 13<br>**Ice Slam [RED]**: line(90, 150), ×1.8 magic (228), chill 80, tell 0.7 s, cd 9 | construct | An avalanche with a job description. |
| **Hoarfrost Archer** | Ranged, r 17 | 170 / 1240 | circle, keeps 400 px | **Ice Arrow**: proj(440), ×1 magic (63), windup 0.45 s, cd 1.6<br>**Volley [PIERCE] [AREA]**: randomCircles(6, 65), leaves ice 5 s, ×0.8 magic (51), tell 1 s, cd 10 |  | Ices the floor, then lets gravity do the rest. |
| **Relic Guardian** | Tank (HP ×1.6, speed 90), r 26 | 816 / 5954 | walk, keeps 60 px | **Mace**: arc(80°, 72), ×1.2 holy (99), windup 0.7 s, cd 2.2<br>**Shield Crush [RED]**: line(80, 120), ×1.7 holy (140), tell 0.6 s, cd 9 | front guard 100%; construct | Will not turn around. Will not discuss it. |
| **Rime Moths** | Swarm, r 9 | 61 / 447 | swarm, keeps 30 px | **Flutter**: line(24, 150), lunges 150 px, ×0.8 magic (20), chill 10, windup 0.32 s, cd 1.6<br>**Frost Dust [PIERCE]**: circle(70) at self, ×0.6 magic (15), chill 40, tell 0.9 s, cd 9 | 5 pieces | Ate every vestment in the Reliquary. Your jumper is next. |
| **Frozen Censer** | Hazard, r 20 | 272 / 1985 | stationary | **Incense Puff**: ring(0, 100), ×1.1 magic (70), chill 20, windup 0.6 s, cd 3<br>**Thurible Swing [PIERCE] [AREA]**: sweep(360°, 2.4 s) r 230, ×1.6 magic (101), chill 40, tell 1 s, cd 12<br>**Hoarfrost Grasp [RED]**: circle(80) at target, ×1.5 magic (95), chill 40, tell 0.8 s, cd 7 | construct | Burns frankincense at minus forty. Smells like a freezer full of church. |

## 8. Zone 7 — Clockwork Citadel

Zone resistances (every enemy and the boss): physical resist 20%.

| Enemy | Role | HP (1st / NG+1) | Movement | Attacks | Traits | Flavor |
|---|---|---|---|---|---|---|
| **Tin Soldier** | Fodder (HP ×1.1), r 17 | 257 / 1704 | walk, keeps 60 px | **Bayonet Thrust**: thrust(30, 80), ×1 physical (75), windup 0.5 s, cd 1.4<br>**Volley Fire [PIERCE] [AREA]**: line(30, room), ×1 physical (75), tell 1 s, cd 9 | packs of 4–4; construct | Marches in step. Falls over in step. |
| **Clockwork Spider** | Swarm (speed 260), r 9 | 70 / 465 | swarm, keeps 30 px | **Bite**: arc(100°, 24), ×0.9 physical (30), shock 15, windup 0.22 s, cd 0.5<br>**Pounce [RED]**: circle(36) at target, leaps, ×1.2 physical (40), tell 0.6 s, cd 6<br>**Self-destruct**: circle(60) at self ×1 physical; die, ×1 physical (33), windup 0.8 s, trigger: hpBelow 0.2 | 4 pieces; construct | Eight legs, one fuse, no patience. |
| **Gear Turret** | Ranged (HP ×1.5), r 20 | 292 / 1937 | stationary | **Bolt**: proj(420), ×1 physical (84), windup 0.45 s, cd 1.5<br>**Laser Sweep [PIERCE] [AREA]**: sweep(360°, 3 s) r room, w 60, tick 0.25 s, 2 gaps, ×1 physical (84), tell 1 s, cd 12 | never flinches; construct | Has one job and a full rotation to do it in. |
| **Brass Juggernaut** | Tank (HP ×1.5, speed 90), r 28 | 877 / 5810 | walk, keeps 70 px | **Piston Punch**: thrust(60, 110), ×1.4 physical (152), windup 0.7 s, cd 2.2<br>**Steam Vent [PIERCE]**: cone(100°, 260), ×1.2 fire (131), burn 40, tell 1.2 s, cd 9<br>**Overdrive [RED]**: line(60, 130), ×0.9/×0.9/×0.9 physical (98), tell 0.7 s, cd 12 | ×1.5 from behind; construct | Armoured at the front, ventilated at the back. Engineering is compromise. |
| **Citadel Magister** | Caster, r 17 | 214 / 1420 | teleport, keeps 350 px | **Arcane Bolt**: proj(340, homing), ×1 void (92), windup 0.55 s, cd 1.8<br>**Time Bubble [PIERCE] [AREA]**: 3× circle(130) at target, leaves timeBubble 6 s, tell 1 s, cd 13<br>**Mirror Images**: 2 illusions for 10 s, windup 0.5 s, cd 14, only if hpBelow(100) | teleports every 5 s | Checks Tock’s sums. Has found an error. It’s you. |
| **Pendulum Knight** | Brute (speed 100), r 28 | 701 / 4648 | walk, keeps 80 px | **Blade Arc**: arc(120°, 96), ×1.3 physical (218), windup 0.75 s, cd 2.4, hyper armor<br>**Pendulum [PIERCE] [AREA]**: sweep(360°, 2 s) r 220, ×1.5 physical (251), tell 1 s, cd 12, hyper armor<br>**Overhead [RED]**: line(70, 200), ×1.9 physical (318), tell 0.7 s, cd 9, hyper armor | hyper armor; construct | Keeps perfect time. Keeps it on your neck. |
| **Repair Drone** | Support, r 14 | 214 / 1420 | hover, keeps 250 px | **Spark**: proj(400), ×0.7 magic (64), windup 0.4 s, cd 2<br>**Zap [PIERCE]**: cone(50°, 140), ×0.8 magic (74), shock 30, tell 0.8 s, cd 7<br>**Repair**: heal 20% (ally); oil circle(90) at self for 10 s, windup 2 s, cd 6, only if constructAlly | construct | Fixes everything except the situation. |
| **Chronomancer's Hand** | Assassin, r 16 | 273 / 1807 | circle, keeps 80 px | **Slash**: arc(100°, 60), ×1 magic (117), windup 0.35 s, cd 1.4<br>**Rewind Strike [PIERCE]**: circle(80) at targetPast(1.0), ×1.8 magic (211), tell 0.6 s, cd 6<br>**Stasis [RED]**: line(40, 150), ×1.2 magic (141), freeze 1.13 s, tell 0.6 s, cd 12 | teleports every 3 s | Strikes where you were. Keep it that way. |
| **Cuckoo Clock** | Hazard, r 22 | 312 / 2066 | stationary | **Cuckoo**: proj(320, homing), ×0.9 physical (75), windup 0.5 s, cd 2<br>**Tick-Tock [PIERCE] [AREA]**: grid(150, 55) checkerboard, 2 sets 1 s apart, ×1.1 physical (92), tell 1 s, cd 12 | never flinches; construct | Cuckoo. Cuckoo. Your rent is due. Cuckoo. |
| **Clockwork Butler** | Fodder (HP ×1.3), r 18 | 304 / 2014 | walk, keeps 50 px | **Silver Tray**: arc(100°, 58), ×1 physical (75), windup 0.5 s, cd 1.6<br>**Silver Service [RED]**: line(40, 200), lunges 200 px, ×1.4 physical (105), tell 0.6 s, cd 8 | packs of 2–3; construct | Will see you out. |

## 9. Zone 8 — The Abyss

Zone resistances (every enemy and the boss): void resist 50%, holy weak 40%.

| Enemy | Role | HP (1st / NG+1) | Movement | Attacks | Traits | Flavor |
|---|---|---|---|---|---|---|
| **Hollow Joe** | Fodder (HP ×1.3), r 18 | 343 / 2072 | walk, keeps 50 px | **Light Combo**: arc(110°, 88), ×1/×1/×1.3 physical (81), windup 0.45 s, cd 2.4<br>**Hollow Lunge [RED]**: line(44, 170), lunges 170 px, ×1.4 physical (87), tell 0.6 s, cd 6<br>**Flask**: heal 40% over 1.2 s, windup 1.2 s, trigger: hpBelow 0.3 | undead | He came down for the fuse box too. He looks tired. |
| **Void Mote Swarm** | Swarm, r 9 | 79 / 478 | swarm, keeps 120 px | **Touch**: line(20, 120), lunges 120 px, ×0.7 void (19), windup 0.45 s, cd 2.2<br>**Collapse [PIERCE]**: circle(90) at target, pieces converge on the target, ×1.3 void (36), tell 1 s, cd 9 | 6 pieces | Six specks of nothing with somewhere to be. |
| **Eye of the Deep** | Ranged, r 18 | 220 / 1328 | hover, keeps 380 px | **Gaze Bolt**: proj(380), ×1 void (69), windup 0.5 s, cd 1.8<br>**Gaze Beam [PIERCE] [AREA]**: beam(52, 450) tracking 14°/s for 2.2 s, tick 0.4 s, ×0.8 void (55), tell 1 s, cd 12 |  | Never blinks. Not even when you get close. |
| **Abyssal Knight** | Tank (HP ×1.4), r 25 | 923 / 5579 | walk, keeps 70 px | **Greatsword Combo**: arc(120°, 96), ×1.2/×1.4 void (126), windup 0.75 s, cd 3.2<br>**Void Cleave [RED] [AREA]**: line(100, room ×0.7), ×2 void (179), tell 0.8 s, cd 10 | front guard 70% | Swore an oath to the void. Still waiting to hear back. |
| **Nullwraith** | Assassin (speed 320), r 16 | 308 / 1860 | dash, keeps 45 px | **Claw**: arc(100°, 56), invulnerable 1 s, ×1 void (97), windup 0.38 s, cd 1.6<br>**Grasp from Below [RED]**: circle(60) at target, ×1 void (97), grab: held 1.2 s, ×1.6 on release, tell 0.6 s, cd 9<br>**Fade**: invulnerable 1 s, windup 0 s, cd 1 | invisible beyond 160 px; undead | You won’t see it coming. That is rather the point. |
| **Maw** | Hazard (HP ×2), r 28 | 703 / 4250 | stationary | **Gnash**: arc(90°, 100), ×1 void (69), windup 0.5 s, cd 2<br>**Bite [PIERCE]**: circle(150) at self, pulls 60 px/s, ×2.2 void (152), tell 1 s, cd 7<br>**Pull**: trigger: passive | pulls 60 px/s within 350 | All mouth. No manners. Kill it from over there. |
| **Landlord's Clerk** | Support, r 17 | 242 / 1461 | hover, keeps 300 px | **Eviction Notices**: 3× proj(260, homing) in a 40° fan, ×0.6 void (46), windup 0.6 s, cd 2.6<br>**Late Fee**: room: lateFee 8 s, windup 0.8 s, cd 14, only if hasAlly<br>**Audit [PIERCE] [AREA]**: room-wide, 4 safe pockets r 90, ×1.5 void (114), tell 1.5 s, cd 18 |  | Per section 4(b)… |
| **Star-Eater** | Brute (HP ×1.5, speed 90), r 33 | 1187 / 7173 | walk, keeps 75 px | **Claw**: arc(110°, 92), ×1.4 void (193), windup 0.7 s, cd 2.4, hyper armor<br>**Supernova [PIERCE] [AREA]**: room-wide, 5 safe pockets r 100, ×2.8 void (386), tell 1.8 s, cd 16<br>**Devour [RED]**: line(70, 130), ×1 void (138), grab: held 1.5 s, ×2.2 on release, tell 0.7 s, cd 12 | hyper armor | Ate a star once. Still hungry. Still glowing a bit. |
| **The Fine Print** | Caster, r 17 | 242 / 1461 | hover, keeps 320 px | **Small Print**: 3× proj(300) in a 24° fan, ×0.6 void (46), windup 0.55 s, cd 2.2<br>**Terms and Conditions [PIERCE] [AREA]**: lanes(5, 80) horizontal, two sets 0.8 s apart, ×1 void (76), tell 1 s, cd 11 |  | You agreed to this. Page 4,011, paragraph 9. |

## 10. Special enemies

These are not part of any zone roster.

**The Instructor** (Brute, 9373 HP at zone 1; hyper armor; never flinches; 9373 HP). He has a whistle. He will use it.
- **Overhead**: line(80, 160), ×1 physical (108), windup 1.4 s, cd 2.5
- **Stomp [RED]**: circle(140) at self, ×1 physical (108), tell 1 s, cd 6
- **Clap [PIERCE] [AREA]**: ring(60, 260), ×0.8 physical (86), tell 1.5 s, cd 8

Below 65% HP (**Second half**):
- **Overhead**: line(80, 160), ×1 physical (108), windup 0.9 s, cd 1.5
- **Stomp [RED]**: circle(140) at self, ×1 physical (108), tell 0.7 s, cd 3.6
- **Clap [PIERCE] [AREA]**: ring(60, 260), ×0.8 physical (86), tell 1 s, cd 5
- **Soccer Volley**: 5× proj(480) in a 36° fan, ×0.6 physical (65), windup 0.8 s, cd 4
- **Run a Lap [RED]**: circle(110) at target, leaps, ×1.3 physical (140), tell 0.9 s, cd 7
- **Full-Court Lob [PIERCE]**: lobbed proj(420) → circle(95) at point, ×0.9 physical (97), tell 1 s, cd 5

**Mimic** (Brute, 220 HP at zone 1; —). Was a chest. Is a problem.
- **Bite**: arc(60°, 70), ×1.2 physical (54), windup 0.5 s, cd 1.4
- **Chomp [RED]**: line(50, 200), lunges 200 px, ×1.8 physical (81), tell 0.6 s, cd 6
- **Tongue Sweep [PIERCE]**: sweep(180°, 1.2 s) r 180, ×1 physical (45), tell 1 s, cd 9

**Gary** (Tank, 1000050 HP at zone 1; never flinches). Pays no rent. Asks no questions. Answers fewer.


The Instructor guards the tutorial hall. He walks the whole hall (D110), does not heal (D111), and at 65% HP blows
the whistle: everything comes faster and he picks on anyone standing back (D107, D226). On death he drops a Legendary
weapon at ilvl 3 with all three skills, or (50%) a spell. Gary is the wandering merchant: he never attacks, and three hits make him leave for the
rest of the playthrough ("Alright then.").

**Boss parts and summons** (spawned by bosses; HP and damage scale with the boss's zone):

- **Fey Light** (`fey_light`, Swarm, HP ×2): **Pop**: circle(60) at self, die, ×0.6 holy, windup 0.7 s, cd 1. lights the room.
- **Foreman Ignatius** (`ignatius_on_foot`, Brute): (on-foot body) **Hammer Throw [PIERCE]**: circle(110) at target, line(40) back to the thrower ×0.8 fire, ×1.3 fire, tell 1 s, cd 7; (on-foot body) **Flame Pillars [PIERCE] [AREA]**: grid(150, 55) checkerboard, 2 sets 0.5 s apart, ×1.1 fire, tell 1 s, cd 11; (on-foot body) **Immolation [RED] [AREA]**: room-wide, 1 safe pocket r 140 (self), ×2.5 fire, tell 1 s, cd 16.
- **Ice Mirror** (`ice_mirror`, Hazard, HP ×1.2): **Frost Glint**: proj(400), ×0.8 magic, chill 20, windup 0.7 s, cd 3.5; **Shatter [AREA]**: circle(110) at self, ×1.2 magic, chill 30, windup 0.9 s, cd 5. never flinches; reflects projectiles; drifts about the room.
- **Corner Turret** (`clock_turret`, Hazard): no attacks. never flinches; immune burn, chill, shock, bleed, poison, freeze, blind, hexed, silence, root, hold; construct.

## 11. Bosses

Common rules (GAME_DESIGN §7):
- Boss base HP is 3,600 at the zone-1 curve (D187), then the zone, cycle and co-op multipliers. Some bosses set their
  own base or a first-playthrough multiplier (D211). The Landlord sets his own.
- A phase ends at its HP threshold. A phase that ends at 0% but is not the last ends on the blow that would have
  killed it, and the next phase refills a fresh bar (D253: Ignatius, the Landlord's phase 4).
- A phase change is an invulnerable transition (2 s by default) that drops the attack in progress.
- Phase multipliers (speed, damage) apply to every attack of that phase. Bracketed hit numbers below already include
  the phase's damage multiplier.
- A boss never repeats the same attack twice in a row and picks by weighted distance.
- **New Game+ third phase (D295):** from NG+1 every zone 1–7 boss has three phases. Its first change moves halfway up
  to full HP and the new change sits halfway from there to 0 (50% → 75% and 37.5%). The new phase, "&lt;last
  phase&gt;: Overtime", is the last phase again with speed ×1.15, damage ×1.15 and cooldowns ×0.8, **plus at least two
  attacks of its own** (D309, `BossDef.overtimeAttacks`; listed under each boss); its arena changes are already in place. Ignatius keeps his split and refilled bar and starts Overtime at 50% of the refilled bar. The
  Landlord is unchanged in NG+.
- **NG+ bonus boss rooms (D278, D290, D322):** from NG+1 one combat room per zone holds a random boss from any zone,
  fighting in its phase 2 for the whole fight, on a full bar worth 30% of the room's zone boss's full HP for the playthrough (not its own). It hits
  like a boss of the room's zone. Arena-bound bosses (the Bloatking, Ignatius, the Landlord) are never picked. It
  pays 30% of the Shards and a boss chest; it is not the zone's boss.

### Arenas

- **The Caretaker**: an open crypt with pillars and open graves (pits he summons Shamblers from).
- **Mother Spore**: a round cave; she stays near the middle; glowing pools on the floor.
- **The Bloatking**: a flooded hall with raised grates; waves are dodged by standing on a grate.
- **Vexthorn**: a forest clearing with trees; a tree stops his charge (and is used up).
- **Foreman Ignatius**: a forge floor with a live lava channel (it hurts from the first second, D219). Phase 2 widens
  the channel and starts two conveyor belts that run along it (D95). His first bar is 60% of his HP (D289); the
  killing blow splits him from the Golem and phase 2 starts on his full HP.
- **Saint Aurelia**: a reliquary nave with pillars. Her ice mirrors drift about the room, reflect your projectiles and
  can be pulled by Gravity Well (D225, D269).
- **Archmagister Tock**: a square arena with a rotating floor ring and turrets in the corners that sweep lasers.
  Sweeping beams hit along the whole arc they turn each frame (D273).
- **The Landlord**: a black platform floating in the void. Falling off costs 50% of max HP and a short climb back. The
  platform shrinks in phases 2 and 3; in phase 4 he is half again the player's size and blinks about it (D279, D315).

### Boss 1 — The Caretaker (Mossy Crypt)

*THE CARETAKER: "Fixes nothing. Buries everything. Keeps your deposit."* Buries the dead, keeps their Glowen. Has buried everyone down here at least once.

HP solo (its first bar): **2520** first playthrough (×0.7 on the first playthrough, D211), 118787 at NG+1, 603314 at NG+2 (D301, D307, D325). Radius 50. Boss hit ×1.0 = 45 first playthrough. undead. Can appear as an NG+ bonus boss (D278).

Phase 1 (100% → 50%; speed ×1, damage ×1):
- **Shovel Swing**: arc(120°, 140), ×1.2 physical (54), windup 0.9 s, cd 2.5, parryable
- **Lantern Toss [PIERCE]**: circle(120) at target, leaves firePuddle 4 s, ×1.3 fire (59), burn 30, tell 1 s, cd 7
- **Grave Call**: summons 2 Shambler (max 4), windup 0.9 s, cd 15
- **Overhead Slam [RED]**: line(90, 200), ring(90, 200) ×0.6 physical, ×1.8 physical (81), tell 0.7 s, cd 6, hyper armor
- **Dirt Sweep [AREA]**: sweep(180°, 1.5 s) r 320, ×0.8 physical (36), blind 1 s, windup 0.9 s, cd 9
- **Last Rites [RED] [AREA]**: ring(0, edge), ×2.6 physical (117), tell 2.2 s, cd 22, only if cycleAtLeast(1), hyper armor

Phase 2 — **The lantern breaks** (50% → 0%; speed ×1.2, damage ×1.25, arena: hazardFloor):
- **Shovel Swing**: arc(120°, 140), ×1.2 physical (68), windup 0.9 s, cd 2.5, parryable
- **Lantern Toss [PIERCE]**: 3× circle(120) at target, leaves firePuddle 4 s, ×1.3 fire (73), burn 30, tell 1 s, cd 7
- **Grave Call**: summons 3 Shambler (max 5), windup 0.9 s, cd 15
- **Overhead Slam [RED]**: line(90, 200), ring(90, 200) ×0.6 physical, ×1.8 physical (101), tell 0.7 s, cd 6, hyper armor
- **Dirt Sweep [AREA]**: sweep(180°, 1.5 s) r 320, ×0.8 physical (45), blind 1 s, windup 0.9 s, cd 9
- **Grave Quake [PIERCE] [AREA]**: expandingRing(320 px/s) 4 gaps of 110 (one toward the centre), ×1.2 physical (68), tell 1 s, cd 10 *(new)*
- **Hands of the Dead [PIERCE] [AREA]**: randomCircles(8, 70) within 420, ×0.6 physical (34), root 1.5 s, tell 1 s, cd 11 *(new)*
- **Last Rites [RED] [AREA]**: ring(0, edge), ×2.1 physical (118), tell 2.2 s, cd 22, only if cycleAtLeast(1), hyper armor

**New Game+ phases (D295):** 1. Phase 1 until 75%; 2. The lantern breaks until 37.5%; 3. The lantern breaks: Overtime until 0%. The last is the Overtime phase: the last phase's attacks plus its own (below) with speed ×1.15, damage ×1.15, cooldowns ×0.8.

**Overtime attacks (D309):** **Coffin Rows [PIERCE] [AREA]** — lanes(5 vertical, w 64, two sets 1 s apart), ×1.3 physical, tell 1.2 s, cd 11; **Gravedigger's Fury [RED]** — three shovel arcs(140°, 170) ×1.0 / ×1.2 / ×1.6, tell 0.7 s, cd 8, hyper armor.

### Boss 2 — Mother Spore (Fungal Caverns)

*MOTHER SPORE: "Everything down here is her child. You are about to be adopted."* A cathedral-sized mushroom with a face in the stalk. Farms Glowen. Calls it family.

HP solo (its first bar): **5580** first playthrough, 150626 at NG+1, 708756 at NG+2 (D301, D307, D325). Radius 66. Boss hit ×1.0 = 61 first playthrough. immune poison. Can appear as an NG+ bonus boss (D278).

Phase 1 (100% → 50%; speed ×1, damage ×1):
- **Stalk Slam**: circle(110) at targetPast(1.0), ×1.3 physical (79), windup 0.8 s, cd 3
- **Spore Bloom [PIERCE] [AREA]**: grid(150, 55), 2 pulses, ×0.8 physical (49), poison 30, tell 1.2 s, cd 9
- **Tendril Whip [RED]**: line(50, 420), ×1.5 physical (91), tell 0.6 s, cd 5
- **Sporeling Birth**: summons 3 Sporeling (max 4), windup 0.9 s, cd 16
- **Gas Vent [AREA]**: cone(90°, 400), leaves poisonCloud 5 s, ×0.3 physical (18), poison 20, windup 0.9 s, cd 10

Phase 2 — **The cap splits open** (50% → 0%; speed ×1.2, damage ×1.25, arena: darken):
- **Stalk Slam**: circle(110) at targetPast(1.0), ×1.3 physical (99), windup 0.8 s, cd 3
- **Spore Bloom [PIERCE] [AREA]**: grid(120, 55), 2 pulses, ×0.8 physical (61), poison 30, tell 1.2 s, cd 9
- **Tendril Whip [RED]**: line(50, 420), ×1.5 physical (114), tell 0.6 s, cd 5
- **Sporeling Birth**: summons 5 Sporeling (max 6), windup 0.9 s, cd 16
- **Gas Vent [AREA]**: cone(90°, 400), leaves poisonCloud 5 s, ×0.3 physical (23), poison 20, windup 0.9 s, cd 10
- **Rain of Caps [PIERCE] [AREA]**: lanes(5, 64) horizontal, two sets 1 s apart, ×1.2 physical (91), tell 1.2 s, cd 11 *(new)*
- **Uproot [RED] [AREA]**: circle(200) at target, leaps, ×2 physical (152), then staggered 3 s, tell 1 s, cd 14 *(new)*

**New Game+ phases (D295):** 1. Phase 1 until 75%; 2. The cap splits open until 37.5%; 3. The cap splits open: Overtime until 0%. The last is the Overtime phase: the last phase's attacks plus its own (below) with speed ×1.15, damage ×1.15, cooldowns ×0.8.

**Overtime attacks (D309):** **Mycelium Web [PIERCE] [AREA]** — six root spokes line(50, room) from her, ×1.3 physical, Poison 30, tell 1.1 s, cd 10; **Cap Burst [RED] [AREA]** — ring(150–460) round her, ×1.7 physical, Poison 25, tell 1.3 s, cd 13 (hug the stalk, keep far, or roll).

### Boss 3 — The Bloatking (Drowned Sewers)

*THE BLOATKING: "Skims the rent. Drinks the runoff. Long may he float."* A drowned monarch on a floating throne of debris, fat on skimmed rent.

HP solo (its first bar): **7560** first playthrough, 173037 at NG+1, 832271 at NG+2 (D301, D307, D325). Radius 60. Boss hit ×1.0 = 77 first playthrough. immune poison. Arena-bound: never a bonus boss (D278).

Phase 1 (100% → 50%; speed ×1, damage ×1):
- **Scepter Swing**: arc(100°, 130), ×1.2 physical (92), windup 0.7 s, cd 2.4, parryable
- **Wave [PIERCE] [AREA]**: wave(140, 340 px/s) from random, grates safe, 2 gaps, ×1.4 physical (107), tell 1.2 s, cd 9
- **Royal Decree [RED]**: line(110, 400), charges 400 px, ×1.6 physical (122), tell 0.7 s, cd 7
- **Summon Court**: summons 2 Drowned (max 3); summons 1 Green Slime (max 1), windup 1 s, cd 18
- **Belch [AREA]**: cone(70°, 350), leaves poisonCloud 4 s, ×0.3 physical (23), poison 25, windup 0.8 s, cd 8

Phase 2 — **The throne sinks** (50% → 0%; speed ×1.2, damage ×1.25, arena: floodAll, movingFloor):
- **Scepter Swing**: arc(100°, 130), ×1.2 physical (115), windup 0.7 s, cd 2.4, parryable
- **Wave [PIERCE] [AREA]**: wave(140, 340 px/s) from random, grates safe, 2 gaps, ×1.4 physical (134), tell 1.2 s, cd 9
- **Royal Decree [RED]**: line(110, 400), charges 400 px, ×1.6 physical (153), tell 0.7 s, cd 7
- **Summon Court**: summons 2 Drowned (max 3); summons 1 Green Slime (max 1); summons 1 Rat Physician (max 1), windup 1 s, cd 18
- **Acid Belch [AREA]**: cone(70°, 350), leaves acid 7 s, ×0.3 physical (29), poison 25, windup 0.8 s, cd 8 *(new)*
- **Crosswave [PIERCE] [AREA]**: wave(140, 340 px/s) from random, grates safe, 2 gaps then wave(140, 340 px/s) from cross, grates safe, 2 gaps (+0.8 s), ×1.3 physical (124), tell 1.2 s, cd 12 *(new)*

**New Game+ phases (D295):** 1. Phase 1 until 75%; 2. The throne sinks until 37.5%; 3. The throne sinks: Overtime until 0%. The last is the Overtime phase: the last phase's attacks plus its own (below) with speed ×1.15, damage ×1.15, cooldowns ×0.8.

**Overtime attacks (D309):** **Tidal Decree [RED]** — Royal Decree three times, line(110, 400) charges re-aimed 0.5 s apart, ×1.6 physical, cd 13; **Undertow [PIERCE] [AREA]** — two expanding rings 1 s apart (3 gaps of 120 px) that pull 50 px/s toward him, ×1.2 physical, tell 1.2 s, cd 11.

### Boss 4 — Vexthorn, the Hollow Stag (Hollow Forest)

*VEXTHORN, THE HOLLOW STAG: "The forest has a heart. He is wearing it, and he will not give it back."* A fey stag with antlers of thorn, and the forest’s last Glowen in a lantern for a heart.

HP solo (its first bar): **10514** first playthrough, 198137 at NG+1, 896868 at NG+2 (D301, D307, D325). Radius 46. Boss hit ×1.0 = 101 first playthrough. Can appear as an NG+ bonus boss (D278).

Phase 1 (100% → 50%; speed ×1, damage ×1, summons 1 Stag Sentinel (max 1, every 15 s)):
- **Antler Gore**: arc(90°, 150), ×1.3 physical (132), bleed 30, windup 0.6 s, cd 2.4, parryable
- **Charge [RED] [AREA]**: line(100, room), charges to the wall, ×1.9 physical (193), tell 0.8 s, cd 8, hyper armor
- **Thorn Burst [PIERCE]**: circle(160) at self, leaves thorns 3 s, ×1.2 physical (122), tell 0.9 s, cd 8
- **Fey Lights**: summons 3 Fey Light (max 5), windup 0.8 s, cd 14
- **Hex Gale [AREA]**: cone(120°, 500), wind cone(120°, 500) for 2 s, ×0.3 physical (30), windup 0.9 s, cd 10

Phase 2 — **The heart-lantern flares** (50% → 0%; speed ×1.2, damage ×1.25, summons 2 Stag Sentinel (max 2, every 15 s), arena: thornWalls, movingFloor):
- **Antler Gore**: arc(90°, 150), ×1.3 physical (165), bleed 30, windup 0.6 s, cd 2.4, parryable
- **Charge [RED] [AREA]**: line(100, room), charges to the wall, ×1.9 physical (241), tell 0.8 s, cd 8, hyper armor
- **Thorn Burst [PIERCE] [AREA]**: circle(220) at self, leaves thorns 3 s, ×1.2 physical (152), tell 1.1 s, cd 8
- **Fey Lights**: summons 5 Fey Light (max 7), windup 0.8 s, cd 14
- **Hex Gale [AREA]**: cone(120°, 500), wind cone(120°, 500) for 2 s, ×0.3 physical (38), windup 0.9 s, cd 10
- **Root Lines [PIERCE] [AREA]**: 5× line(50, room) at random angles, leaves roots 3 s, ×1.3 physical (165), tell 1.2 s, cd 12 *(new)*
- **Triple Charge [RED] [AREA]**: line(100, room), charges to the wall ×3 (re-aimed, 0.5 s apart), ×1.9 physical (241), tell 0.8 s, cd 14, hyper armor *(new)*

**New Game+ phases (D295):** 1. Phase 1 until 75%; 2. The heart-lantern flares until 37.5%; 3. The heart-lantern flares: Overtime until 0%. The last is the Overtime phase: the last phase's attacks plus its own (below) with speed ×1.15, damage ×1.15, cooldowns ×0.8.

**Overtime attacks (D309):** **Bramble Cage [PIERCE] [AREA]** — ring(90–260) round the target leaving thorns 3 s, ×1.3 physical, Bleed 30, tell 1 s, cd 10 (stand still in the middle or get out); **Wild Hunt [RED] [AREA]** — spectral stags roll down 3 vertical lanes (w 110, 700 px/s), ×1.7 physical, knockback 120, tell 1.2 s, cd 12.

### Boss 5 — Foreman Ignatius (Ashen Forge)

*FOREMAN IGNATIUS: "Twelve-hour shifts. No breaks. You are the break."* A fire-cult blacksmith riding an Anvil Golem’s shoulders. The Golem does not get a say.

HP solo (its first bar): **6418** first playthrough, 83553 at NG+1, 366965 at NG+2 (D301, D307, D325). Radius 58. Boss hit ×1.0 = 124 first playthrough. construct. Arena-bound: never a bonus boss (D278).

Phase 1 (100% → 0%; speed ×1, damage ×1, bar 60% of full HP, arena: hazardTiles):
- **Golem Slam**: circle(120) at self, ×1.4 physical (174), windup 0.9 s, cd 3
- **Hammer Throw [PIERCE]**: circle(110) at target, line(40) back to the thrower ×0.8 fire, ×1.3 fire (161), tell 1 s, cd 7
- **Forge Strike [RED]**: line(90, 200), ×1.8 fire (224), tell 0.7 s, cd 8
- **Flame Pillars [PIERCE] [AREA]**: grid(150, 55) checkerboard, 2 sets 1 s apart, ×1.1 fire (137), tell 1 s, cd 11
- **Stoke [AREA]**: lanes(2, 60) horizontal, lit 3 s (tick 0.25 s), ×0.5 fire (62), burn 12, windup 1 s, cd 12

Phase 2 — **The Golem goes molten** (fresh bar → 0%; speed ×1.2, damage ×1.25, second body: Foreman Ignatius, arena: setTiles, hazardTiles, movingFloor, movingFloor):
- **Golem Slam**: circle(120) at self, ×1.4 physical (217), windup 0.9 s, cd 3
- **Forge Strike [RED]**: line(90, 200), ×1.8 fire (279), tell 0.7 s, cd 8
- **Stoke [AREA]**: lanes(2, 60) horizontal, lit 3 s (tick 0.25 s), ×0.5 fire (78), burn 12, windup 1 s, cd 12
- **Molten Shockwave [PIERCE] [AREA]**: expandingRing(300 px/s) 3 gaps of 110 (one behind it) (one toward the centre), ×1.3 fire (202), tell 1.2 s, cd 11 *(new)*
- **Forge Draw**: gravityWell circle(160) at self for 2.2 s; pull 650 px/s within 1500 for 1 s, windup 0.7 s, cd 14 *(new)*
- (on-foot body) **Hammer Throw [PIERCE]**: circle(110) at target, line(40) back to the thrower ×0.8 fire, ×1.3 fire (202), tell 1 s, cd 7
- (on-foot body) **Flame Pillars [PIERCE] [AREA]**: grid(150, 55) checkerboard, 2 sets 0.5 s apart, ×1.1 fire (171), tell 1 s, cd 11
- (on-foot body) **Immolation [RED] [AREA]**: room-wide, 1 safe pocket r 140 (self), ×2.5 fire (388), tell 1 s, cd 16 *(new)*

**New Game+ phases (D295):** 1. Phase 1 until 0%; 2. The Golem goes molten until 50% of a fresh bar; 3. The Golem goes molten: Overtime until 0%. The last is the Overtime phase: the last phase's attacks plus its own (below) with speed ×1.15, damage ×1.15, cooldowns ×0.8.

**Overtime attacks (D309):** **Slag Rain [PIERCE] [AREA]** — 10 circles(70) within 450 px of the target leaving slag 4 s, ×1.1 fire, Burn 20, tell 1.1 s, cd 10; **Anvil Drop [RED] [AREA]** — the Golem leaps onto the target, circle(210), ×1.9 fire, tell 1.1 s, cd 13, stuck 1.5 s after landing.

### Boss 6 — Saint Aurelia the Unthawed (Frozen Reliquary)

*SAINT AURELIA THE UNTHAWED: "Four hundred years on guard duty. Nobody told her she could stop."* Froze at her post to keep the collectors out. The ice was a blessing, once.

HP solo (its first bar): **18841** first playthrough, 251879 at NG+1, 1057161 at NG+2 (D301, D307, D325). Radius 46. Boss hit ×1.0 = 142 first playthrough. Can appear as an NG+ bonus boss (D278).

Phase 1 (100% → 75%; speed ×1, damage ×1):
- **Blessed Blade**: arc(110°, 190), ×1/×1/×1.4 magic (199), chill 20, windup 0.75 s, cd 3, parryable
- **Ice Spears [PIERCE] [AREA]**: lanes(5, 80) vertical, ×1.2 magic (171), tell 1.1 s, cd 9
- **Frostbite Lunge [RED]**: line(50, 260), lunges 260 px, ×1.7 magic (242), chill 70, tell 0.6 s, cd 6, hyper armor
- **Hymn [PIERCE] [AREA]**: expandingRing(280 px/s) 4 gaps of 110 (one toward the centre), ×0.6 holy (85), silence 2 s, tell 1 s, cd 11
- **Mirror of Faith**: summons 3 Ice Mirror (max 3), windup 0.9 s, cd 20

Phase 2 — **The ice shatters** (75% → 0%; speed ×1.2, damage ×1.25, arena: movingFloor):
- **Blessed Blade**: arc(110°, 190), ×1/×1/×1.4 magic (249), chill 20, windup 0.75 s, cd 3, parryable
- **Ice Spears [PIERCE] [AREA]**: lanes(5, 80) vertical, two sets 0.8 s apart, ×1.2 magic (213), tell 1.1 s, cd 9
- **Frostbite Lunge [RED]**: line(50, 260), lunges 260 px, ×1.7 magic (302), chill 70, tell 0.6 s, cd 6, hyper armor
- **Hymn [PIERCE] [AREA]**: 2× expandingRing(280 px/s) 4 gaps of 110 (one toward the centre), 1 s apart, ×0.6 holy (107), silence 2 s, tell 1 s, cd 11
- **Mirror of Faith**: summons 3 Ice Mirror (max 3), windup 0.9 s, cd 20
- **Avalanche [PIERCE] [AREA]**: lanes(4, 120) horizontal, boulders roll 650 px/s, ×1.5 physical (267), knockback 140, tell 1.2 s, cd 12 *(new)*
- **Judgment [RED] [AREA]**: line(120, room), charges to the wall, ×2.2 magic (391), tell 0.9 s, cd 14, hyper armor; then **Frost Nova [PIERCE] [AREA]**: expandingRing(300 px/s) 4 gaps of 110 (one toward the centre), ×1 magic (178), tell 1 s, cd 0 *(new)*

**New Game+ phases (D295):** 1. Phase 1 until 87.5%; 2. The ice shatters until 43.75%; 3. The ice shatters: Overtime until 0%. The last is the Overtime phase: the last phase's attacks plus its own (below) with speed ×1.15, damage ×1.15, cooldowns ×0.8.

**Overtime attacks (D309):** **Glacial Cross [PIERCE] [AREA]** — a cross of line(70, room) through her, then a second turned 45° 0.8 s later, ×1.3 magic, Chill 40, tell 1.1 s, cd 11; **Saint's Wrath [RED]** — four cone(100°, 210) cuts turning 90° each, ×1.0 ×3 then ×1.4, Chill 20, tell 0.75 s, cd 9, hyper armor; **Shatterstorm [PIERCE] [AREA]** — 12 icicles circle(75) within 520 px of the target falling over 1.5 s, ×1.2 magic, Chill 30, tell 1 s, cd 12.

### Boss 7 — Archmagister Tock (Clockwork Citadel)

*ARCHMAGISTER TOCK: "Your appointment was at the start of time. You are late. He is billing you."* Keeps the Landlord’s ledger. Wound himself up to do it, and has never once run down.

HP solo (its first bar): **21043** first playthrough, 281126 at NG+1, 1112060 at NG+2 (D301, D307, D325). Radius 48. Boss hit ×1.0 = 188 first playthrough. construct. Can appear as an NG+ bonus boss (D278).

Phase 1 (100% → 40%; speed ×1, damage ×1.2, summons 4 Corner Turret (max 4, every 1 s, in the corners)):
- **Arcane Volley**: 5× proj(360) in a 72° fan, ×0.8 void (181), windup 0.7 s, cd 2.6
- **Laser Sweep [PIERCE] [AREA]**: sweep(360°, 3 s) r room, w 60, tick 0.25 s, 2 gaps, ×1 magic (226), tell 1 s, cd 12
- **Time Bubble [PIERCE] [AREA]**: 3× circle(140) at target, leaves timeBubble 6 s, tell 1 s, cd 13
- **Gear Dash [RED]**: line(110, 380), charges 380 px, ×1.6 physical (362), tell 0.7 s, cd 6, hyper armor
- **Tin Reinforcements**: summons 4 Tin Soldier (max 4), windup 1 s, cd 22

Phase 2 — **The clock runs backward** (40% → 0%; speed ×1.2, damage ×1.69, summons 4 Corner Turret (max 4, every 1 s, in the corners), arena: reverseFloor):
- **Arcane Volley**: 5× proj(360) in a 72° fan, ×0.8 void (254), windup 0.7 s, cd 2.6
- **Laser Sweep [PIERCE] [AREA]**: 2× sweep(360°, 3 s) r room, w 60, tick 0.25 s, 2 gaps, opposite ways, ×1 magic (318), tell 1 s, cd 12
- **Time Bubble [PIERCE] [AREA]**: 3× circle(140) at target, leaves timeBubble 10 s, tell 1 s, cd 13
- **Gear Dash [RED]**: line(110, 380), charges 380 px, ×1.6 physical (508), tell 0.7 s, cd 6, hyper armor
- **Tin Reinforcements**: summons 4 Tin Soldier (max 4), windup 1 s, cd 22
- **Rewind Volley [PIERCE] [AREA]**: 8× circle(90) at eachPlayerPast(1.0), ×1.1 void (350), tell 0.9 s, cd 13; repeated 2 more times at once, re-aimed (tell 0.7 s each) *(new)*
- **Overclock [RED]**: line(110, 380), charges 380 px, ×1.6 physical (508), tell 0.8 s, cd 15, hyper armor; repeated 3 more times at once, re-aimed (tell 0.6 s each) *(new)*

**New Game+ phases (D295):** 1. Phase 1 until 70%; 2. The clock runs backward until 35%; 3. The clock runs backward: Overtime until 0%. The last is the Overtime phase: the last phase's attacks plus its own (below) with speed ×1.15, damage ×1.15, cooldowns ×0.8.

**Overtime attacks (D309):** **Chrono Lattice [PIERCE] [AREA]** — checkerboard grid(160, r 60) in two sets 0.9 s apart, ×1.2 void, tell 1.1 s, cd 11; **Pendulum [RED] [AREA]** — a 180° sweep r 420 round him over 1.2 s, ×1.5 physical, tell 0.9 s, cd 9, hyper armor.

### Boss 8 — The Landlord (The Abyss)

*THE LANDLORD: "Rent is due. It has always been due. Clause nine says the rent is you."* Owns everything under the stairs. Every room you cleared was his. You were subletting.

HP solo (its first bar): **40389** first playthrough, 364867 at NG+1, 1144858 at NG+2 (D301, D307, D325). Radius 46. Boss hit ×1.0 = 233 first playthrough. Arena-bound: never a bonus boss (D278).

Phase 1 — **The Interview** (100% → 66%; speed ×1, damage ×1):
- **Briefcase Swing**: arc(110°, 160), ×1.3 physical (303), windup 0.8 s, cd 2.6, parryable
- **Eviction Notices**: 6× proj(250, homing) in a 80° fan, ×0.6 void (140), windup 0.7 s, cd 5
- **Void Cleave [RED] [AREA]**: line(120, room ×0.7), ×2 void (466), tell 0.8 s, cd 8, hyper armor
- **Audit [PIERCE] [AREA]**: room-wide, 5 safe pockets r 120, ×1.6 void (373), tell 1.6 s, cd 12
- **Late Fee**: summons 2 Landlord's Clerk (max 2), windup 0.9 s, cd 22

Phase 2 — **The Eviction** (66% → 33%; speed ×1.2, damage ×1.25, size ×1.3, arena: shrinkPlatform):
- **Briefcase Swing**: arc(110°, 160), ×1.3 physical (378), windup 0.8 s, cd 2.6, parryable
- **Eviction Notices**: 6× proj(250, homing) in a 80° fan, ×0.6 void (175), windup 0.7 s, cd 5
- **Void Cleave [RED] [AREA]**: 4× line(120, room ×0.7) spokes, ×2 void (582), tell 0.8 s, cd 8, hyper armor
- **Audit [PIERCE] [AREA]**: room-wide, 4 safe pockets r 120, ×1.6 void (466), tell 1.6 s, cd 12
- **Late Fee**: summons 2 Landlord's Clerk (max 2), windup 0.9 s, cd 22
- **Four-Arm Flurry [RED]**: cone(90°, 180), ×0.81/×0.81/×0.81/×0.81 void (236), tell 0.7 s, cd 9, hyper armor *(new)*
- **Gaze Beams [PIERCE] [AREA]**: 2× beam(60, 600) tracking 35°/s for 4 s, tick 0.25 s, opposite ways, ×0.8 void (233), tell 1 s, cd 14 *(new)*
- **Supernova [PIERCE] [AREA]**: room-wide, 4 safe pockets r 110, ×2.6 void (757), tell 1.8 s, cd 16 *(new)*

Phase 3 — **The Deep Lease** (33% → 0%; speed ×1.2, damage ×1.5, pull 70 px/s within 2000, stationary at farThird, size ×1.14 (D315: was ×1.9), projectiles ×1.4, summons 2 Hollow Joe (max 2, every 10 s), arena: shrinkPlatform):
- **Eviction Notices**: 10× proj(250, homing) in a 140° fan, ×0.6 void (210), windup 0.7 s, cd 5
- **Gaze Beams [PIERCE] [AREA]**: 2× beam(60, 600) tracking 35°/s for 4 s, tick 0.25 s, opposite ways, ×0.8 void (279), tell 1 s, cd 14
- **Supernova [PIERCE] [AREA]**: room-wide, 3 safe pockets r 110, pulls 70 px/s, ×2.6 void (908), tell 1.8 s, cd 16
- **Maw [PIERCE]**: circle(220) at self, pulls 70 px/s, ×2.5 void (873), tell 1.5 s, cd 6 *(new)*
- **Foreclosure [RED] [AREA]**: a 60° slice (r 520) sweeping 120° round him over 1.5 s, from his gaze the way the arrow points to where he looks next (D315), ×2.1 void (734; D300: 30% less), tell 1.2 s, cd 9 *(new)*
- **Collapse [PIERCE] [AREA]**: ring(220, edge), pulls 70 px/s, collapseFloor, tell 1.5 s, cd 15, only if ringReachable *(new)*

Phase 4 — **The Landlord, Unbound** (fresh bar → 0%; speed ×3, damage ×1.6, bar 1.2× the HP the phase before had, 4.5 s transition, clears the field, bar "The Landlord, Unbound", size ×0.45 (D315: was ×0.3), blinks every 2.4 s (0.35 s warning, 110–260 px)):
- **Final Notice**: arc(130°, 72), ×0.56/×0.56/×0.8 void (298), windup 0.38 s, cd 1.8, parryable *(new)*
- **Repossession [RED]**: line(56, 300), charges 300 px, ×1.3 void (484), tell 0.55 s, cd 7, hyper armor; repeated 2 more times at once, re-aimed (tell 0.42 s each) *(new)*
- **Hostile Takeover [RED] [AREA]**: 4× line(90, room ×0.6) spokes, ×1.8 void (671), tell 0.7 s, cd 8, hyper armor *(new)*
- **Eminent Domain [PIERCE] [AREA]**: randomCircles(7, 80) within 340, ×1.5 void (559), tell 1 s, cd 9 *(new)*
- **Total Eviction [PIERCE] [AREA]**: circle(170) at self, ×2.2 void (820), tell 1 s, cd 10 *(new)*
- **Eviction Notices**: 5× proj(250, homing) in a 60° fan, ×0.6 void (224), windup 0.7 s, cd 5

Beating The Landlord ends the lease: the stairs go up, the credits roll, and the New Game+ bonfire lights.

## 12. Elites

An Elite is a roster enemy with one affix (GAME_DESIGN §6.4): ×3 HP, ×1.5 damage, 30% bigger, ×1.5 poise, a
guaranteed better drop. 8% of non-swarm spawns roll one solo (+4% per extra player), at most 2 per room per player;
never a swarm piece, a special enemy or a boss. **From NG+1 every combat room has at least one Elite** (D296).

| Affix | Effect | Look |
|---|---|---|
| Frenzied | ×1.4 move speed | red speed lines |
| Armored | takes 40% less physical damage | grey plates |
| Vampiric | heals 20% of the damage it deals | dark red aura, heal numbers |
| Arcane | three orbs orbit it; touching one is a Piercing ×0.5 Void hit (once per 0.8 s) | violet orbs |
| Molten | leaves fire puddles (3 s) as it moves | orange trail |
| Frostbound | Chill 20 per second to players within 120 px | blue aura |
| Shielded | a barrier worth 25% of its max HP; it comes back 5 s after it breaks (D213) | cyan bubble |
| Summoner | calls adds every 12 s | green rune circle |

## 13. What the data validation checks

`src/data/validate.ts` (run by `npm run validate:data` and in dev at startup):

1. Every roster enemy has exactly one normal attack, 1–2 specials, and at least one special that is Red or Piercing.
2. No attack is both Red and Piercing. Status and control ids exist; summons name known enemies; no effect restores a
   Thermos charge (D38).
3. Every Piercing attack is escapable (GAME_DESIGN §5.6): telegraph ≥ 0.6 s, expanding rings have a gap, lanes and
   grids leave a body-wide gap, pulls are outrun. A room-wide Red burst needs a telegraph of at least 1.0 s.
4. Every zone has 10 registered enemies, at least 2 Red users and 2 Piercing users.
5. Every boss has at least 2 phases with thresholds in order, a Red and a Piercing attack in every phase, at least 2
   new attacks per later phase, at least 2 [AREA] attacks, a known arena, a draw id, a flavor line and an intro.
6. `tests/unit/bossEscape.test.ts` walks every boss attack in its real arena, every phase, and checks a walking player
   always has somewhere to stand (D94).
