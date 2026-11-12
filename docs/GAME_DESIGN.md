# Dungeon Joe — Game Design

> Joe went down the stairs to find the fuse box. The stairs kept going.

A souls-like action RPG with the pace of Hades, the room-to-room rhythm of The Binding of Isaac and the loot of
Diablo 3. Top-down arena rooms, procedurally generated zones, cooldown skills on every weapon, spells on staffs and
talismans, bonfires, a flask, red attacks you cannot block and blue attacks you cannot dodge, mimics, gems, New
Game+, ten classes, ten save files and four-player online co-op in the browser.

**This document is the current reference: every rule here is how the game works today** (written at v1.3.19). Bracketed ids
such as (D293) point to [DECISIONS.md](DECISIONS.md), which keeps the history and the reasons. When this document
and the code disagree, the code wins and this document should be fixed. Content tables (every enemy, boss, item,
spell and class) live in [CONTENT_ENEMIES.md](CONTENT_ENEMIES.md), [CONTENT_ITEMS.md](CONTENT_ITEMS.md) and
[CONTENT_SPELLS_CLASSES.md](CONTENT_SPELLS_CLASSES.md); schemas in [DATA_MODEL.md](DATA_MODEL.md); generation in
[PROCGEN.md](PROCGEN.md); co-op in [NETCODE.md](NETCODE.md); look and sound in [ART_AUDIO.md](ART_AUDIO.md).

## Contents

1. [Pillars](#1-pillars)
2. [The run](#2-the-run) — structure, the Training Hall, scaling
3. [Stats](#3-stats) — formulas, class boosts, requirements, levelling
4. [Controls](#4-controls)
5. [Combat](#5-combat) — movement, attacks, stamina, dodge, block, damage types, statuses, stuns, Red and Blue, areas
6. [Enemies](#6-enemies) — roles, zone mixes, AI, poise, Elites, mimics
7. [Bosses](#7-bosses)
8. [Gear](#8-gear) — slots, rarity, skills, affixes, set perks, weight, proficiency, reinforcing, gems, cards
9. [Bonfires, the Thermos and death](#9-bonfires-the-thermos-and-death)
10. [Spells](#10-spells)
11. [Chests, reliquaries, Gary and the Bestiary](#11-chests-reliquaries-gary-and-the-bestiary)
12. [Online co-op](#12-online-co-op)
13. [New Game+](#13-new-game)
14. [Saves](#14-saves)
15. [Classes](#15-classes)
16. [UI and HUD](#16-ui-and-hud)
17. [Settings, platforms and installing](#17-settings-platforms-and-installing)
18. [Glossary](#18-glossary)
19. [Story and Glowen](#19-story-and-glowen)
20. [Achievements](#20-achievements)
21. [Statistics](#21-statistics)
22. [Tools: debug menu, balance report, version](#22-tools-debug-menu-balance-report-version)
23. [Not built](#23-not-built)

---

## 1. Pillars

1. **Every hit is a decision.** Stamina, a 5-second dodge and telegraphed attacks mean you commit.
2. **Readable danger.** Every attack has a telegraph you can learn. Red means *don't block*. Blue means *don't be
   there*. Nothing is both. If the dot at your feet is outside an attack's marker, you are safe (D262).
3. **The floor is lava, often.** Enemies and bosses paint the arena with lines, rings, grids, sweeps and zones.
4. **Loot you feel.** A new weapon changes your verbs (skills), your rhythm (gems) and your build (stats).
5. **Grim place, dry voice.** The dungeon is deadly serious. The item descriptions are not (D14).

## 2. The run

### 2.1 Structure

A **playthrough** is one character, one map seed and one cycle (0 = the first playthrough, 1 = NG+1, …). It is 8
zones in order (D22):

| # | Zone | Theme | Boss |
|---|---|---|---|
| 1 | Mossy Crypt | undead, moss, bone | The Caretaker |
| 2 | Fungal Caverns | beasts, spores, glow | Mother Spore |
| 3 | Drowned Sewers | drowned, slimes, rats | The Bloatking |
| 4 | Hollow Forest | fey, wolves, treants | Vexthorn, the Hollow Stag |
| 5 | Ashen Forge | fire cult, constructs | Foreman Ignatius |
| 6 | Frozen Reliquary | frost knights, wraiths, choir | Saint Aurelia the Unthawed |
| 7 | Clockwork Citadel | automata, magisters | Archmagister Tock |
| 8 | The Abyss (final) | void horrors, hollow Joes | The Landlord (four phases) |

Each zone is a procedurally generated grid of **12 + ⌊zone / 2⌋ rooms** (12–16) plus its boss room
([PROCGEN.md](PROCGEN.md)):

- **Start room** with a bonfire.
- **Combat rooms**: the room locks when any player is 70 px inside (D52, D151), its waves spawn from the zone's enemy
  mix, and the doors open when it is clear. 10% of combat rooms are **ambushes** (the first wave comes on entry).
  Cleared rooms stay clear until you rest at a bonfire.
- **Treasure rooms** (1, 50% a second): a chest.
- **Spell reliquary** (35% a zone; 100% from zone 3 on while the character knows fewer than 2 spells).
- **Merchant room** (20% a zone, never zone 1): Gary, the wandering merchant (§11).
- **Boss anteroom** with a bonfire, then the **boss room**. Beating the boss opens the stairs down.
- A quarter of combat and ambush rooms have a **small chest** standing in them from the moment you enter (D93), and
  half have **hazardous terrain** (§5.1).
- In NG+ one combat room per zone holds a **bonus boss** (§7.5).

**Zone mix** (D241, D242): every zone has **10 enemy types**. Each visit (zone and cycle) draws **5** of them, and
every room of that visit uses those 5 (plus Elites). A mix always has at least one melee and one non-melee type, and
at least one Red user and one Piercing user.

Every doorway has a torch on each side: unlit while the door is shut, lit when it is open (D263).

### 2.2 The Training Hall and The Instructor (new characters only)

A new character's first room is the **Training Hall**: eleven sign-posted stations teach move, aim, attack, block,
parry (a dummy swinging on a timer; a well-timed block with no parrying shield also counts, D96), dodging through a
Red attack, stepping out of a Blue ring (40–150 px, D107), two-handing, the Thermos, and walking over Slow and Hurt
ground (stations 10 and 11, D126). **Nobody can die in the hall** (D73): a killing hit leaves you at 1 HP with 1.5 s
of invulnerability.

The hall's east door opens on **The Instructor's room** (D90). The Instructor has **9,373 HP** (unscaled, D226), a
second half from **65%** with faster attacks and three ranged throws (a soccer-ball volley, a Red leap, a lobbed
basketball; D107, D110), roams the whole room and never heals (D111). His room's way down to the first bonfire stays
**locked while he lives** (D127): kill him, or die to him and wake at the first bonfire with the tutorial done. A
death to him counts as a death but does not spoil zone 1's clean run (D207). Beating him drops **500 Glowen** and,
for each player, either a random unknown spell (50%) or a **Legendary weapon at item level 3 with its first skill**
(D89). Not in NG+.

### 2.3 Scaling

Let `z` be the zone (1–8), `c` the cycle and `p` the number of players.

**The zone curve** (`cycleZoneCurve`, D209), with `k` = 0.55 for HP, 0.35 for damage, 1.1 for Shards:

```
first playthrough (c = 0):  curve = 1 + k (z − 1)
New Game+ (c ≥ 1):          top = 1 + 7k   (the first playthrough's zone 8)
                            curve = (1.05 top + 0.30 top × (z − 1) / 7) × 1.1^(c − 1)
```

So NG+ zone 1 starts 5% above the first zone 8 and climbs to 35% above it by zone 8.

**HP and damage** follow the curve up to NG+1 and then grow by cycle (D258, D259); **Shards** keep the plain curve:

```
enemyHP     = role HP × enemy's own mult × curve(z, min(c,1), 0.55) × NG1_HP × ngGrowth(c) × co-op HP (D159)
              × reinforcement factor (D303: (1 + 0.15p) / (1 + 0.2p), p = the reinforcement expected by that zone)
              × NG+ level growth (D307, below) × level pace (D325, below)  (enemy damage × its damage columns too)
enemyDamage = role hit × enemy's own mult × curve(z, min(c,1), 0.35) × NG1_DMG × ngGrowth(c)
              × zone damage factor × NG+ zone factor (room enemies only)
enemyShards = role Shards × 5 × zone Shard factor × curve(z, c, 1.1)          (per player, instanced)
bossHP      = the same × NG+ boss factor (D301: NG_BOSS_HP, by the boss's zone; NG+2's column from NG+2 on)
itemLevel   = z + 8c                                                         (D299)
```

| Cycle | HP ×(on the NG+1 curve) | Damage × | Notes |
|---|---|---|---|
| NG+1 | **4.5** (`NG1_HP_MULT`) | **1.4** (`NG1_DMG_MULT`) | |
| NG+2 | ×2.5 on NG+1 | ×2.5 on NG+1 | `NG_STEPS` |
| NG+3 | ×2 on NG+2 | ×2 | |
| NG+4 | ×2 on NG+3 | ×2 | |
| NG+5 on | ×1.15 a cycle | ×1.15 a cycle | `NG_LATE_STEP` |

**NG+ boss HP** is also sized to a fight length (D301, `NG_BOSS_HP`): the balance report's median build, hitting
nonstop, needs about **5 minutes** for a zone 1–7 boss and **8** for the Landlord at NG+1, and about **8** and **11**
minutes from NG+2 on.

| Boss zone | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| NG+1 × | 1.52 | 1.88 | 2.16 | 2.03 | 1.56 | 1.73 | 1.9 | 1.34 |
| NG+2 on × | 2.7 | 2.89 | 3.1 | 2.67 | 1.89 | 1.94 | 1.97 | 1.15 |

**Boss HP trim** (D353, D354): from the owner, every zone boss has **half** that HP in NG+1 and NG+2 (`NG_BOSS_HP_TRIM` in
`data/roles.ts`, applied with the table above). The trim then climbs back to 1 so the next cycle is not a jump: ×0.6 at
NG+3, 0.7, 0.8, 0.9, and NG+7 on is the plain curve. A boss now grows about 1.9–2.7× from NG+2 to NG+3 (it would have been
3.1–4.5×) and 1.4–1.9× a cycle after that. The fight-length targets above are shorter at NG+1–NG+6 by the same shares
(the balance report flags them).

**Zone 3 room enemies** (D363): the enemies a zone 3 room's waves spawn (Elites too, every cycle) hit **25% harder** than the
curve gives them (`ZONE_ROOM_ENEMY_DMG` in `data/roles.ts`). The Bloatking, what he summons in his arena, Mimics and
special NPCs keep the plain curve.

**Zone 2 boss, NG+1** (D362): Mother Spore hits a further **15% harder** in NG+1 only (`NG_BOSS_DMG_TRIM` in `data/roles.ts`, by
zone and cycle). The random encounter boss (D278) keeps hitting like the boss of the room's zone, so any boss met in zone 2 at
NG+1 carries it and Mother Spore met elsewhere does not.

**NG+ boss damage** (D314): every boss hits **×1.75** from NG+1 on (they had fallen behind the players' gear and
levels); every later cycle's growth builds on it. The Caretaker's Last Rites stays about 600 at NG+1 (D277).

**Level pace** (D325): New Game+ levels cost twice what D307 set, so every enemy and boss takes a factor by cycle and
zone (`LEVEL_PACE_COMP` in `data/roles.ts`; HP, damage, and a boss HP adjustment), fitted on the balance report so its
builds, at their new levels, see the same kill times and hits to die as before. NG+1 enemies are about 2–23% lighter
and hit 1–21% softer by zone, NG+2–4 about 10% lighter and 5–30% softer; from NG+5 the report's builds sit at the stat
soft cap either way, so the factors go to 1.

**Early New Game+ trim** (D352): room enemies (Elites too; not bosses or special NPCs) lose a further share of HP in the first
NG+ zones, after every curve above (`NG_ENEMY_HP_TRIM` in `data/roles.ts`): NG+1 zone 1 −60%, zone 2 −44%, zone 3 −25%,
zone 4 −16%; NG+2 zone 1 −15%. Zone average HP lands at 780 / 987 / 1,320 / 1,666 (NG+1 zones 1–4) and 4,747 (NG+2 zone 1).

**NG+ level growth** (D307): New Game+ levels go further than the first playthrough's, so every enemy
and boss grows by 70% of what those levels give a player (`NG_LEVEL_COMP`, by zone; NG+3 on uses NG+2's column):

| Zone | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| NG+1 HP × | 1.004 | 1.012 | 1.019 | 1.024 | 1.034 | 1.041 | 1.048 | 1.044 |
| NG+1 damage × | 1 | 1.02 | 1.039 | 1.067 | 1.084 | 1.111 | 1.137 | 1.16 |
| NG+2 on HP × | 1.041 | 1.039 | 1.037 | 1.035 | 1.033 | 1.033 | 1.029 | 1.029 |
| NG+2 on damage × | 1.165 | 1.171 | 1.181 | 1.183 | 1.195 | 1.197 | 1.214 | 1.218 |

**The long stat curve** (D311) makes builds stronger from the late first playthrough on (damage ×1.0–1.03 in the first
playthrough, ×1.1–1.6 at NG+1, ×1.7–2.3 at NG+2 against the old curve). To NG+2 every enemy and boss takes **70%** of
that gain (`STAT_CURVE_COMP`: HP by the damage gain, damage by the HP gain). From NG+3 a cycle table (`NG_LATE`) takes
over, because the old curve had stopped growing there: boss fights stay about 8 minutes (the Landlord 11) through NG+7
and stretch to about 9.5 (13.5) by NG+10; a build takes more and more hits to bring down through NG+7 (median room
hits 12 at NG+2, about 15 at NG+7), and then enemy damage climbs so NG+10 needs about half as many hits as NG+2 and
the later zones' bosses can kill in one.

| Cycle | NG+3 | NG+4 | NG+5 | NG+6 | NG+7 | NG+8 | NG+9 | NG+10 on |
|---|---|---|---|---|---|---|---|---|
| HP × | 1.5 | 1.2 | 1.26 | 1.28 | 1.29 | 1.33 | 1.36 | 1.4 |
| Damage × | 1.06 | 0.74 | 0.74 | 0.73 | 0.69 | 0.84 | 1.09 | 1.57 |

**Zone damage factor** (every cycle, bosses too, D231): zone 4 ×1.1, zones 5–6 ×1.15, zone 7 ×1.35, the rest ×1.

**NG+ room-enemy damage by zone** (cycle ≥ 1, not bosses or special NPCs, D287): zone 1 ×1, 2 ×2, 3 ×1.64, 4 ×1.59,
5 ×1.5, 6 ×1.37, 7 ×1.34, 8 ×1.65 (refitted after D308), so the average room hit climbs from zone 2 to zone 8 (about 232 → 333 at NG+1).

Individual bosses carry their own base HP and multipliers (§7.2). The Caretaker has 30% less HP in the first
playthrough (D211).

**Zone Shard factors** (tuned, D51): 1: 0.46 · 2: 0.35 · 3: 0.34 · 4: 0.26 · 5: 0.27 · 6: 0.24 · 7: 0.26 · 8: 0.19, so
a full clear of a zone pays for its levels within ±20% (a unit test holds it). Expected character level at each
zone's end, solo, first playthrough (`EXPECTED_LEVEL`): 10 · 20 · 32 · 42 · 52 · 62 · 72 · 80 (D147).

## 3. Stats

Six stats, 1–**999** each (D311; most of a stat's worth comes by 150, the soft cap): **HP, Endurance, Bonk, Slicey, Brain, Prayer**. Level-1 characters have 48 points (class tables in CONTENT_SPELLS_CLASSES §3). Each level adds one point; level = points − 47.

| Stat | Governs |
|---|---|
| **HP** | Max health. |
| **Endurance** | Max stamina, stamina regen and max equip load (D82). |
| **Bonk** | Damage of heavy weapons and crossbows; walking speed while casting (D106). |
| **Slicey** | Damage of fast weapons and bows; cast speed (D106). |
| **Brain** | Staff spells (Spell Skill, §10); the magic side of hybrid weapons. |
| **Prayer** | Talisman spells; the holy/fire side of hybrid weapons; a slightly better Thermos. |

Scaling grades are spread on purpose from E to S (D40): weapons with poor scaling have a higher base. Do not flatten
them.

### 3.1 Formulas

```
maxHP        = 100 + m × P(HP),  P = Σ 1–30: 14 · 31–50: 8 a point (680 at 50); past 50 P(50) × statGrowth(HP) (D311)
               (HP 50: 680 · 100: 1,260 · 150: 1,695 · 300: 2,793 · 999: 4,885, before m)
maxStamina   = 70  + m × Σ per Endurance point: 1–30: 3.5 · 31–60: 2 · 61–150: 0.8 · 151–999: 0.3
staminaRegen = 22 + (0.165 per Endurance point to 200, 0.02 past it) × m per second, 0.6 s after any spend
               (D314: 55 a second at 200 Endurance)
maxEquipLoad = 26 + m × Σ per Endurance point:  1–30: 1.5 · 31–60: 1.0 · 61–150: 0.5 · 151–999: 0.1

f(s): 1 − 0.982^s up to 50 (f(10) .17 · f(30) .42 · f(50) .60); 50–100 straight up so an S weapon doubles
      (f(100) 1.72); 100–150 at three-quarters that pace (f(150) 2.56, the soft cap); 150–999 easing off to f(999) 8.74,
      so an S weapon's stat multiplier is ×2.13 at 50, ×4.27 at 100, ×5.87 at 150, ×17.6 at 999 (D311)
statGrowth(s) = (1 + 1.9 f(s)) / (1 + 1.9 f(50))  (1 to 50, ×2 at 100, ×8.25 at 999)
grades (D88): S 1.9 · A 1.55 · B 1.15 · C 0.8 · D 0.45 · E 0.2 · – 0

weaponPower = base1 × (1 + 0.45 (ilvl − 1)) × (1 + Σ grade × f(effStat) × m) × rarity power × reinforcement
              × 0.9 if it scales A or S with Bonk (as rolled, variant included; D343)
              × 1.2 if Slicey-based: its Slicey grade above its Bonk grade (D347; never the Bow, Twin Axes,
              Spellblade, Dawn Glaive or Chakrams, D348) × 0.4 if below requirement
   effStat: Bonk counts ×1.5 (max 999) while two-handing (D72); everything else as it is
hit         = weaponPower × swing mult × (1 + damage %) + gem adds + flat affix damage   (weaponHitByType, D294)
armorDef    = def1 × slot mult × (1 + 0.6 (ilvl − 1)) × reinforcement
damageTaken = incoming × 100 / (100 + Def[type])
thermosHeal = 40% maxHP × (1 + 0.003 × Prayer × m) × (1 + heal bonuses)
castSpeed   × (1 + 0.25 f₀(Slicey) m)      castMove = 50% + 0.25 f₀(Bonk) m of walking speed   (D106)
   f₀(s) = 1 − 0.982^s, the old settling curve (these two never run away, D311)
```

`m` is the class boost for that stat (§3.2). Requirements on a weapon's primary stat rise 2 per item level up to level 8, then 0.5 per level, never past 90
(`reqAtIlvl`, D299); secondary requirements stay.

### 3.2 Primary and secondary stats (D184)

Every class has a **primary stat (×1.25)** and a **secondary (×1.15)**: what every point of that stat gives is
multiplied (never the base), everywhere it counts — max HP; stamina, regen and equip load; weapon scaling; casting
while moving; cast speed; Spell Skill; the Thermos's Prayer bonus. Requirements and level costs use the raw stats.
Marked P / S in the creator, the inventory and the Level up tab.

### 3.3 Requirements (D37, D72, D88, D210)

Every weapon, shield and casting tool lists minimum stats; hybrid weapons also need their Brain or Prayer. Two-handing
counts Bonk ×1.5 toward requirements. Requirements are checked against your stats including gear bonuses
(`itemMeetsReqs`).

- Weapon below requirement: **40% damage**, **skills locked**, a red "!" on the slot.
- Shield below requirement: guards at **half** its block values, cannot parry.
- Staff / talisman below requirement: **cannot cast**.
- Spell below its own Brain/Prayer requirement: cannot be slotted.
- Gear below requirement gives **none of its buffs** (affixes, gems, bands, ring effects, legendary powers, set
  perks).

### 3.4 Levelling

Enemies drop **Shards**; spend them at a bonfire's **Level up** tab. Cost from level `L` to `L + 1` (D39, D147):

```
cost(L) = floor((60 × 1.045^L + 15 L) × early(L)),   early(L) = 1 + 0.6 × max(0, (21 − L) / 20)   for L < 80
cost(L) = floor(5,500 + 3 × (L − 80))                                                  for L ≥ 80 (D307, D325)
L=1: 124 · L=10: 323 · L=20: 458 · L=30: 674 · L=50: 1,291 · L=79: 3,127 · L=80: 5,500 · L=200: 5,860 · L=300: 6,160
```

The first playthrough ends near level 80; past it a level costs nearly the same, twice what D307 set (D325): one clear
of each zone reaches about 130 by the end of NG+1, 186 by the end of NG+2 and 247 by the end of NG+3. A thorough player
(about a third more Shards, as measured) is near 300 at the end of NG+3. Enemies give back what the slower levels take
away (`LEVEL_PACE_COMP`, below).

The tab plans points with **+1 / −1** (free points first, then Shards), shows every affected number **now → after**,
and spends only on **Confirm**; leaving with unconfirmed points asks Lock in / Discard / Keep editing (D142).

Death drops all unspent Shards as a **Shardpile** where you died (in a boss room, just inside the door). Touch it to
recover; die again first and it is gone (D3).

**No respec** (D341): stat points, once placed, stay. Tears of Undoing are gone; a save that still held some got 2,000
Glowen for each, and free points left over from an earlier respec are still placed for nothing at a bonfire.

## 4. Controls

Every action is rebindable on keyboard/mouse and gamepad (two slots each, plus Hold variants on the pad; D34, D85).
Defaults (Xbox names; PlayStation shown when detected):

| Action | Keyboard / mouse | Gamepad |
|---|---|---|
| Move | WASD | Left stick |
| Aim | Mouse | Right stick |
| Attack (light combo) | Left click | RT |
| Block / parry (off-hand crossbow: shoot, D291) | Right click | LT |
| Dodge | Space | **B** |
| Weapon skill 1 / 2 / 3 | Q / E / R | LB / RB / Y |
| Spell 1 / 2 / 3 | 1 / 2 / 3 | D-pad left / up / right |
| Thermos | C | X |
| Quick-use item | G | D-pad down (tap) |
| Next quick-use item | T or mouse wheel | Hold D-pad down |
| Interact | F | **A** |
| Two-hand toggle | Shift | Right stick click |
| Swap weapon | X | Left stick click |
| Swap off hand (D228) | Hold F + X | Hold A + left stick click |
| Inventory | Tab or I | View |
| Map | M | Hold View |
| Pause | Esc or P | Menu |
| Debug menu | Ctrl+Shift+D, then the owner code | — |

The pad layout follows Dark Souls (D122): A interacts and confirms, B dodges and backs out of every menu.

**Menus under a pad** (D122, D144–D148, D166, D169, D265): the focused control is always highlighted; menus open on
their first content box; LB / RB step through tabs and **wrap** (the bonfire and its inventory form one loop); lists
wrap at their ends; Up from the content reaches the tab bar; the right stick scrolls; left / right change a focused
slider; **X / □** sends the focused control its second action (equip as 2nd weapon, next ring slot); **Y / △** (or L)
locks the focused item or gem. A button a menu used is swallowed until released, so closing with B never dodges
(D147).

**Aim:** the mouse aims at the cursor. On a pad the character faces the right stick; with it neutral, melee goes to the
nearest enemy within 160 px of the facing cone. Aim assist (strength in Settings) snaps projectiles within ±14° of an
enemy. On a pad, a small silver **aim arrow** at the local player's feet shows which way they face (D343): two winged
curves wrap the front half of the eye-coloured dot and meet at an arrow, longer with a bow, crossbow, chakram, staff
or talisman in either hand. The wings are see-through at their back ends and solid toward the arrow (D344).

**Per-character pad layout** (D266): each character saves its own gamepad buttons, menu confirm / back and aim
assist; keyboard keys, button-picture style, hold/toggle block and touch settings stay global. On the title screen
the Gamepad tab edits the default layout, which new characters copy.

Touch controls on phones and tablets (D143), the Steam Controller over WebHID (D206, D208, D214) and Firefox
(D235) are covered in §17.

## 5. Combat

### 5.1 Movement, terrain and holes

- Rooms are 1280 × 704 px (40 × 22 tiles of 32 px). Walking speed 260 px/s, changed by equip load, Chill, buffs and
  class perks.
- **Hazardous terrain** (D126, D160, D167): half of combat and ambush rooms roll patches (30% of those are *heavy*:
  4–8 big patches up to 30% of the floor; otherwise 1–3 patches up to 8%), never in boss arenas, start or bonfire
  rooms, always leaving a clear route joining every door, spawn and chest.
  - **Slow** (gooey, themed per zone): −35% walking for players and walking enemies (fliers unaffected). Never
    shortens a dodge, leap or knockback; never stacks.
  - **Hurt** (the same spiked patch in every zone, coloured by zone): players take **3% of max HP every 0.5 s**,
    ignoring defense; dodge i-frames skip a tick; enemies are never hurt.
- **Holes** (D173, D175, D185): pits and the Abyss's void block every body's own movement — walking, dodging, dashes,
  leaps, a swing's step. Only an attack puts you in: a knockback, a pull, or floor collapsing under you. A pit costs
  30% of max HP; the void 50% and 1.5 s to climb back (untouchable while falling). Fliers path round holes too. A
  body left half over a hole is slid clear.

### 5.2 Attacks and stamina

Each weapon class has a light-attack **combo** (2–4 swings): windup, active, recovery, a forward step, a hitbox (arc,
thrust, line or projectile) and a damage multiplier. Holding attack continues the combo; the last swing recovers
longer; the next swing can start in the back 55% of a recovery. Attack speed (gems, affixes, buffs) scales all three
phases, capped at ×1.6.

- **You walk while swinging** at ×0.6 (very fast weapons) down to ×0.18 (very slow) of normal speed (D88); Twin Daggers held in both hands walk at ×0.8 (D346).
- **Hyper armor**: heavy weapons' active frames (every swing or the last of the combo) ignore hit interruptions.
- **Hitstop** 40–90 ms by weapon weight (Settings can turn it off), screen shake by damage, white flash and floating
  numbers coloured by type (yellow on a weakness, grey when resisted; D88).
- **Stamina** (D105, D193): every stamina cost a player pays is ×1.15; weapon swings, weapon skills and spells cost
  ×1.5 on top **and only start with the stamina to pay in full** (a cost never exceeds a full bar). Dodging and
  blocking work with any stamina left. A held attack starts by itself once the bar refills enough.
- **Bows** need both hands; shooting one held one-handed two-hands it and shoots on the same press (D203). A bow or
  crossbow shot is a **volley of three** (straight and 5° to each side, D205) that **hits any one enemy at most
  once** (D264). Shots keep full damage to 250 px, then fall to 70% at 750 px (D88). A bow charged 0.6 s deals ×1.8
  and pierces one.
- **Projectile range** (D185, D186): players' shots fly at most 850 px; enemies' 425 px. Enemy shots stop at props;
  players' fly over them (D180). Player spell projectiles are ×4 their listed size (D204).

### 5.3 Dodge

- A 0.45 s dash of 220 px, i-frames from 0.05 s to 0.40 s, 10 stamina (× the multipliers above). Equip load changes
  its distance and i-frames (§8.6).
- **One charge, 5.0 s recharge**, shown as a ring around you. Fleet affixes, the Fleet Ring, Fleetfoot gems,
  proficiency and set perks shorten it, to a **floor of 3.0 s**. Chill adds 1.5 s; Hexed adds 2 s while active.
- I-frames do **not** work against Piercing (Blue) attacks.

### 5.4 Block, parry, two-handing, being staggered

**Shields** (off hand) block while the block button is held, against hits from the front:

| Shield | Physical | Elemental (incl. Holy/Void) | Stability (stamina per 100 blocked) | Parry window |
|---|---|---|---|---|
| Buckler (small) | 60% | 20% | 45 | 0.18 s |
| Targe (small) | 70% | 30% | 40 | 0.16 s |
| Round Shield (medium) | 80% | 35% | 30 | 0.12 s |
| Kite Shield (medium) | 88% | 45% | 28 | 0.10 s |
| Heater Shield (medium) | 90% | 50% | 26 | none |
| Greatshields | 100% | 55–65% | 16–20 | none |

Values rise +1% physical / +1.5% elemental per item level (caps 100% / 85%); rarity and reinforcement cut what gets
through and the stamina it costs (D198, D221). Shield proficiency improves parry windows and block stamina (D215).
At 0 stamina you are **guard broken**: 1.5 s stagger and ×1.5 damage taken. Small shields parry best, some mediums
cannot, greatshields never (D130).

**Parry**: tapping block opens the shield's window. A **parryable** hit inside it is parried: every normal-kind melee
attack and every enemy projectile unless marked *unparryable*; Red attacks cannot be parried (they guard-break);
Piercing attacks cannot be parried (blocking them works). A parried melee attacker is **riposte-staggered** for 2 s and
your next light hit on it deals **×2** (Riposte Master ×3; D88). A parried projectile flies back with the same damage.
Bosses can be parried only on attacks marked *parryable*, and need two parries within 6 s to stagger.

**Two-handing** (Shift): the off hand is set aside, its gems too (D316) (a tool in the weapon hand still casts, D117).
Twin daggers and twin axes two-handed are **dual-wielded** and hit **50% harder** (D318). Bonk counts ×1.5
(§3.1). Holding block is a **weapon guard**: 45% physical, 15% other types, stability 12, no parry.

**Being hit**: your **Poise** (D312) is the share of your max HP a hit must deal to stagger you: **8%**, plus armour
(per piece light 1 / 2 / 1, medium 2 / 5 / 3, heavy 4 / 8 / 5 for head / body / legs: a full set +4, +10, +17) and a
held shield (medium +2, great +5; none while two-handing), plus rings (Ballast Ring +5 / +7 / +10 by rarity, the
Ballasted affix +2–5) and the Load-Bearing Wall set perk (+5 / +10 / +18) (D313), plus poise buffs. A hit of at least that interrupts you with
a 0.3 s stagger unless you have hyper armor; a **projectile needs twice** your poise; smaller hits only flinch. Poise
shows on the stats panel and on armour and shield cards. A hit on a held player does not stagger them out of the hold.

**Enemy front guards** (D176): a guarding enemy cuts physical damage by its guard value but other types only by 30% of
it (`GUARD_NONPHYS_SHARE`). Twin Daggers deal ×1.5 from behind (a crit); the Brass Juggernaut takes ×1.5 to its back
from anything (D97).

### 5.5 Damage types, weaknesses and statuses

**Five damage types** (D80): **Physical** (white), **Magic** (blue; frost and lightning are Magic), **Void**
(grey-black), **Fire** (red), **Holy** (yellow). Armor and shields list a defense per type; shields favour physical.

**The weakness chart** (D81), applied to each part of a player's hit after resistances:

| Attacking type | ×1.5 against | ×0.6 against |
|---|---|---|
| Magic | Holy | Fire |
| Void | Fire | Holy |
| Holy | Void | Magic |
| Fire | Magic | Void |
| Physical | — | — |

An enemy's **type** is the damage type of at least half its attacks (weighted), else Physical; it is drawn in that
colour, and its windups and shots glow in the attack's type.

**Statuses** build a 0–100 meter, decay 15/s when not applied (after 0.5 s), and trigger at 100:

| Status | Trigger effect |
|---|---|
| Burn | 3% max HP a second for 4 s (bosses take 40% of it) |
| Chill | builds **twice as fast** as the others (D330); −30% attack speed and move speed for 3 s, +1.5 s on the dodge recharge; a second trigger while Chilled **Freezes** (1.5 s listed) |
| Shock | for 3 s the next hit taken is ×1.2 and interrupts; drains 25 stamina |
| Bleed | players: 12% of max HP at once. Enemies: 10% of **current** HP (at least 3% of max); bosses 5% of current HP |
| Poison | 2% max HP a second for 8 s (bosses take 40% of it) |

**Control effects** are applied directly for a fixed time and refresh rather than add:

| Control | Effect | Typical listed length |
|---|---|---|
| Freeze | cannot act or move (bosses: −50% speed instead) — a **full stun** (§5.6) | 1.5 s |
| Hold (a grab, or a control like Screech) | cannot act; a grab's extra damage lands when it lets go; a teammate hitting the grabber for ≥ 5% of its HP breaks it — a **full stun** | 1.2–2 s |
| Root | cannot move; can attack, block and cast; a dodge breaks it after 0.5 s | 1–1.5 s |
| Silence | no weapon skills or spells | 2 s |
| Blind | the view closes to 35%; telegraphs still draw | 1.5 s |
| Hexed | dodge recharge +2 s while active | 6 s |

Enemies and zones can be **immune** (`statusImmune`). Players show meters and control icons under the HP bar. Purify
and Holy Water clear everything. While grabbed, rooted or frozen, grey stones circle the player so being stuck never
looks like dead controls (D252). Healing over time keeps ticking while frozen or held (D250).

### 5.6 The stun rule (D293)

Every **full stun** on a player — a grab's hold, a freeze (Chill's too), a hold control — goes through one rule:

1. It lasts **70%** of its listed length (`PLAYER_STUN_MULT`).
2. **None takes hold while one is on, or for 0.5 s after one ends** (`STUN_GRACE_S`), whatever the kinds. A refused
   grab still deals its hit.
3. **Stuns in a row get shorter**: one starting within **6 s** of the last one ending lasts half as long, the next a
   quarter, never less than a quarter (2 s → 1 s → 0.5 s → 0.5 s). The chain lapses 6 s after the last stun ends.

A grab let go early starts the grace and chain from that moment. A rest, a respawn, a revive or a wipe resets it.
Roots, blinds, silences, hexes and the hit stagger are not stuns; stuns on enemies are unchanged; a mimic's devour
(§6.6) is its own scripted grab.

### 5.7 Red, Blue and the rules every attack follows

Every enemy has a **normal attack** and one or two **specials**, at least one Red or Piercing. A second special may be
a **utility** (summon, buff, split, trail, teleport, heal, trap), telegraphed like any attack.

- **Red (unblockable, "Crimson")**: the enemy tints red with a pulse 0.6 s before the hit. Block and parry fail: you
  take the hit and are guard-broken. **Dodge through it** (i-frames work) or get out of range.
- **Piercing (blue, "Spectral")**: the exact area is drawn on the floor at least 0.8 s ahead (longer for bigger
  areas). **I-frames do not help**; blocking works, parrying does not. Leave the area.
- **No attack is ever both.** Colour-blind support: a skull over Red users, a hollow ring over Piercing users, and a
  striped fill on Piercing floors.

**What is tested against what you see:**
- **Area attacks test the dot at your feet** (5 px, 9 px below your centre; D262): if the dot is outside the marker,
  you are safe. Melee swings and other non-area hits test the body (14 px).
- **A charge's or lunge's red bar is its whole hit area** (D272): from where the attacker starts over its full travel
  plus its reach (radius + 22 for a charge, + 18 for a lunge), cut at a wall. Outside the bar is safe.
- **Sweeping beams** are tested each frame along the arc they turned (1.5° steps or finer); a ticking sweep hits a
  target at most once per 0.75 s (or its tick, if longer) (D273).
- **Two-set attacks** (alternating lanes, two-set grids): set B's marker appears `setGapS` after set A's and charges
  for the same windup — A shows, B shows, A hits, B hits (D261).
- Inner walls, pillars, props and trees are drawn **above** attack markers so a marker never hides an obstacle
  (D129, D155).

**Escapability** (data tests, D47, D94, D114): every Piercing area and every ticking area must leave a walking player a
way out:

```
(telegraph − 0.1 s) × (260 − pullSpeed) ≥ distanceToSafety + 40 px
```

with `distanceToSafety` the radius (circles, cones, lines), half a lane (lanes, grids: lanes and grids leave ≥ 32 px
gaps), the nearest gap of an expanding ring, or the nearest pocket edge. Every expanding ring has **at least 4 gaps
plus one facing the room centre** that stays at the same angle through a series (D101, D114); gaps and pockets are
placed within reach of every player. The Sewers' Wave has two 130 px breaks and the Citadel's full-turn Laser Sweep two
safe bands (D163). A walking-escape simulation checks every boss phase in its real arena (D94). Room-wide **Red**
attacks are allowed (i-frames beat them) but need a telegraph of at least 1.0 s. Every zone mix has a Red and a
Piercing user; every boss has both kinds and at least two room-covering patterns.

### 5.8 Area pattern primitives

`circle`, `ring`, `line`, `cone`, `lanes` (vertical or horizontal, optional two sets), `grid` (checkerboard, optional
two sets), `sweep` (a turning cone or beam), `expandingRing` (with gaps), `randomCircles`, `wave` (a travelling wall,
optionally with breaks), `pockets` (the whole room except safe circles), `trail`, `beam` (a tracking line). Each has a
telegraph look and a hit test (DATA_MODEL §3 `PatternDef`); bosses chain them with `sequence`.

### 5.9 Consumables

The quick-use slot holds Throwing Knives, Firebombs, Frost Jars, Holy Water (clears statuses, Holy burst), Stamina
Tonics, Lures (draw aggro) and Shard Pouches; G uses the selected one, T / the wheel / holding D-pad down switches
without using one (D181). Bought at bonfires, found in chests, dropped rarely. Up to 10 of each.

## 6. Enemies

### 6.1 Roles

`fodder`, `swarm`, `ranged`, `caster`, `support`, `brute`, `assassin`, `tank`, `hazard`. Melee: fodder, brute,
assassin, tank; the rest are non-melee. Role base stats are in `src/data/roles.ts` and CONTENT_ENEMIES §1. Every zone
has 10 types (80 regular enemies, D242) covering these roles.

### 6.2 AI

A state machine: idle → alert → approach/kite → windup → attack → recover → reposition. Each enemy has a preferred
range and a move style (walk, dash, circle, flank, hover, burrow, teleport, stationary). Attacks are weighted by
distance and cooldowns, with a room-wide limit on how many specials wind up at once (2 in zones 1–3, 3 after).
Enemies with a projectile attack keep within 340 px and only shoot within 425 px (D186). Co-op targeting weighs
recent damage, proximity and taunts, re-evaluated every 1.5 s.

### 6.3 Waves and rooms

Room threat budgets are ×1.5 the PROCGEN values (D79). Each extra co-op player adds **one full solo-size wave** to
every room (D159). In NG+, rooms in zones 1–7 get zone 8's budget priced in the zone's own mix, so they hold about as
many enemies as zone 8's (D276). At most 12 per wave and 18 alive (per player). Shards and drop chances are divided by
the room's size against a solo room, so every player earns the same per room.

### 6.4 Poise and stagger

An enemy's **poise** is set by its size: 0.05 × radius² (D78) — a rat 4, a skeleton 14, a knight 29, a brute 45.
Elites are 30% bigger and have ×1.5 poise on top (D105). **One hit staggers** an enemy (0.6 s; heavy weapons 0.9 s),
cancelling its attack, only if that hit's poise damage reaches its poise; hits do not add up. Harder swings (finishers,
charged shots, skills) hit poise harder. Hyper armor doubles an enemy's poise for that swing. After a stagger the same
enemy cannot be poise-staggered again until **2 s after it recovers** (D103). **Bosses** have a large poise pool that
hits wear down (refills after 3 s unhit; grows +150% per extra co-op player, D194); their hyper-armor swings cannot be
staggered.

### 6.5 Elites

**8%** of eligible spawns solo, 12% / 16% / 20% with 2–4 players, up to 2 per player per room (D79); never bosses,
swarm pieces or special enemies. In NG+ **every combat room has at least one** (D296). An Elite has **×3 HP, ×1.5
damage**, is 30% bigger, glows and shows its affix, gives **3× Shards**, and drops an item **15%** of the time from the
Elite rarity row (D84). Affixes: Frenzied (+40% speed), Armored (−40% physical taken), Vampiric (heals 30% of its max HP each hit that lands, D336; was 20% of damage
dealt), Arcane (orbiting Piercing orbs), Molten (a pool of fire every 3 s, twice its radius, D330), Frostbound (chill aura), Shielded (a barrier of 25% max
HP that comes back full **5 s after it is broken**, D213), Summoner (spawns fodder).

### 6.6 Mimics

**8%** of chests are mimics (treasure and room chests; never reliquaries or the tutorial; D105). A mimic looks like a
chest but breathes. **Opening one** (D179): its arms drag you in and it **bites every 0.7 s for 15% of max HP**,
unblockable. Solo it always kills (nothing can hurt it while it eats the last player standing). In co-op the others
can kill it to free you; if the bites down you, it climbs out to fight the rest. **Attacking it first** wakes it as a
zone-scaled enemy (Red bite, Piercing tongue sweep); killed, it drops the chest's loot plus a Mimic-row roll. The
Mimic's Tooth power turns mimics off.

### 6.7 Immune enemies

An enemy that is immune (faded, briefly invulnerable, a boss changing phase) is drawn **solid gold** with a glint
(D109, D164). Stealthy enemies stay see-through because they still take damage. A scripted boss transformation plays in
its own colours (D279).

## 7. Bosses

### 7.1 Framework

One boss per zone, in its own arena. Every boss has an **intro** (storm-in, roar, a freeze-frame with its name, about
4.9 s, skippable after 0.5 s; only the first meeting in a run, D87, D102), a **boss bar** (no phase ticks, D226) and
**phases**:

- A boss's HP **stops at each phase threshold** (a big hit cannot skip a phase). A phase change is a transition
  (2 s invulnerable unless the phase says otherwise; telegraphs clear) and swaps in the next attack table; phase 2
  usually brings ×1.2 speed and ×1.25 damage plus new attacks.
- A phase may end at 0% and **refill the bar** (`refillHp`): the killing blow leaves the boss at 1 HP and the next
  phase starts on a fresh bar (D253). A phase's bar may be a share of the boss's full HP (`barMult`, D289) or sized from
  what the previous phase had to lose (`hpOfPrevPhase`, D279). A party HP rescale keeps the current bar's share.
- Phases can change the arena (lava, moving floors, D95), add summons, passives (pulls, split bodies, blinks) and
  scripted transitions.
- Base HP: the boss role's **3,600** (D187) unless the boss sets its own; co-op HP ×(1 + 1.25 per extra player).
- Every boss attack can be avoided with skill and placement (D94).

### 7.2 The eight bosses

| Zone | Boss | Base HP | Phases (first playthrough) |
|---|---|---|---|
| 1 | The Caretaker | 3,600 (×0.7 in the first playthrough, D211) | 2nd at 50% |
| 2 | Mother Spore | 3,600 | 2nd at 50% |
| 3 | The Bloatking | 3,600 | 2nd at 50% (whirlpool, D95) |
| 4 | Vexthorn | 4,140 (D217) | 2nd at 50%; Stag Sentinels 1 → 2 |
| 5 | Foreman Ignatius | 3,600 | 1st bar **60%** of his HP (D289); its end splits Golem and Foreman, 2nd phase refills to full (D253) |
| 6 | Saint Aurelia | 5,544 (D224, D226) | 2nd at **75%** (D226); drifting ice mirrors (D225) |
| 7 | Archmagister Tock | 5,400 (D233) | 2nd at **40%**; phase damage ×1.2 then ×1.6875 |
| 8 | The Landlord | 9,000, damage ×1.5 (D256) | 2nd at 66%, 3rd at 33%, then **phase 4 on a second bar** (§7.4) |

Zone damage factors (§2.3) apply to bosses too. Full sheets in CONTENT_ENEMIES §9.

### 7.3 New Game+ bosses

- **A third phase for zones 1–7** (D295): the first phase change moves halfway up to full HP and a new change sits
  halfway from there to 0 — 50% → **75% and 37.5%**; Aurelia 87.5% / 43.75%; Tock 70% / 35%; Ignatius keeps his split
  and refill, and his third phase starts at 50% of the refilled bar. The third phase, "<last phase>: Overtime", is the
  last phase again with speed and damage ×1.15 and cooldowns ×0.8, **plus at least two attacks only Overtime has**
  (D309, `BossDef.overtimeAttacks`): Caretaker Coffin Rows / Gravedigger's Fury; Mother Spore Mycelium Web / Cap Burst;
  Bloatking Tidal Decree / Undertow; Vexthorn Bramble Cage / Wild Hunt; Ignatius Slag Rain / Anvil Drop; Aurelia
  Glacial Cross / Saint's Wrath / Shatterstorm; Tock Chrono Lattice / Pendulum (CONTENT_ENEMIES §11). Its arena changes
  are already in place. Derived from
  the boss's data at spawn (`ngBossDef`).
- **The Caretaker's Last Rites** (D277): from NG+1, a room-wide **Red** blast (2.2 s telegraph, 22 s cooldown, about
  600 a hit at NG+1, growing each cycle) in every phase. Dodge it.

### 7.4 The Landlord, Unbound (D279)

When his third phase runs out he stops at 1 HP and transforms for 4.5 s (invulnerable; every telegraph, shot, hazard
and add of his side clears): knocked down, he rises, a golden-violet aura flares, he screams and black spiked plate
forms. **Phase 4** is player-sized, three times as fast, on a fresh bar of **1.2 × the HP his third phase had**
(scaled for NG+ and co-op), named "The Landlord, Unbound". He **blinks** every 2.4 s (a flash where he stands and a
mark where he lands, 0.35 s later; never within 110 px of a player, never on the void). Attacks: Final Notice (a
parryable three-cut combo), Repossession (three Red charges), Hostile Takeover (a Red cross), Eminent Domain (Piercing
circles round the target), Total Eviction (a Piercing burst with 1 s to walk out) and eviction notices. He dies, and
the credits roll, only when phase 4's bar is empty. His earlier phases shrink the void platform (D69).

### 7.5 NG+ bonus boss rooms (D278, D290, D322, D360)

From NG+1 one combat room per zone (seeded) holds a random boss from any zone in its **second phase** (from NG+2 on, its
**third phase**, the Overtime one with its new look, D360), on a **full bar
worth 30% of the room's zone boss's** full HP in this playthrough (D322: an Archmagister met in zone 1 has 30% of the
Caretaker's HP, not of its own), instead of the room's waves ("… waits here, weakened."). It hits as
hard as a boss of the room's zone and stays in that phase. Bosses whose phase 2 needs their own arena (`arenaBound`:
the Bloatking, Ignatius, the Landlord) are never picked. Rewards: Shards ×0.3 and a boss chest's loot. It is not the
zone's boss: boss kills, best times and boss achievements ignore it. Its arena's changes and timed summons stay in its
arena, except Vexthorn's Stag Sentinels, which still run with him (D364: `BossDef.bonusSummons`, two at once in his second
phase, a fallen one called back after 15 s, scaled for the room's zone, gone when he falls).

### 7.6 Rewards

Per player: **2–5 items** from the boss rarity row (20 / 35 / 30 / 11 / 4, D84), a **gem 65%** of the time (D281;
one extra quality roll), 150 × zone Glowen, and Soul Essence (§8.8). 25% of boss kills
place a **spell reliquary** in the arena (rolled from the world seed, so it is still there on return). The stairs down
open. Bosses beaten count toward the Thermos (§9.2). Beating a boss adds to the boss's Bestiary entry (§11).

## 8. Gear

### 8.1 Slots

Weapon hand · Off hand · **2nd weapon** · **2nd off hand** (D228) · Head · Body · Legs · **4 rings** · Quick-use.
Swap weapon swaps the weapon hand with the 2nd weapon; hold Interact and press Swap weapon to swap the off hands. Only
what is in use counts (weight, effects). Swapping works any time outside an attack.

- Weapons go to the weapon hand; shields to the off hand.
- **Staffs, talismans and crossbows go in any of the four weapon slots** (D117, D228, D291); choosing one in the bag
  asks "Which hand?". A staff or talisman in the weapon hand swings a weak bash (D128) and casts on Q/E/R (§10). A
  **crossbow in the off hand fires on the block button** with its own power and stamina, while the weapon keeps its
  combo; with it there you cannot block or parry. **Its skills sit on the spell keys** (1 / 2 / 3, the D-pad) and in
  the HUD's spell slots, with the crossbow's own power and unlocks (D316). Two-handing sets the off hand aside.
- The bag holds 60 items. An empty armor slot shows the character bare (D176).

### 8.2 Rarity

| Rarity | Colour | Affixes | Sockets (weapon, staff, talisman / armor, shield; D298) | Damage / block power |
|---|---|---|---|---|
| Common | white | 0 | 0 / 0 | ×1 |
| Uncommon | green | 1 | 0–1 / 0 | ×1.06 |
| Rare | blue | 2 | 1 / 0–1 | ×1.12 |
| Epic | purple | 3 | 1–2 / 1 | ×1.20 |
| Legendary | orange | 3 + a legendary power | 2 / 1 | ×1.28 |

Rarity power (D178, D221) multiplies weapon and casting-tool damage and tightens shields.

**Drops** (D84, D98): an item drops from **6%** of standard kills (swarm pieces 1.5%) at 70 / 22 / 5 / 2.5 / 0.5;
**Elites 15%** at 45 / 35 / 12.5 / 6 / 1.5; **bosses 2–5 items** at 20 / 35 / 30 / 11 / 4. Small chests 25 / 40 / 25
/ 8 / 2, treasure chests (two items) as bosses, mimics 0 / 20 / 45 / 27 / 8. First playthrough zones 1–2 never roll Epic or Legendary and zones 3–4 never Legendary;
from NG+1 every source's Legendary share is ×1.2 a cycle, the rest shrinking in proportion (D327, CONTENT_ITEMS §12).
Loot is instanced per player. A player's
own drops favour weapons that scale with their class's primary stat (+30%), secondary (+15%) or both (+55%); staffs
count as Brain, talismans as Prayer; HP and Endurance give nothing (D254, D317). Most kills also shed a puff of Glowen (35%, D83).

Every item has its own id; duplicate ids are repaired on load and pickup (D232).

### 8.3 Item level and weapon skills

Item level = zone + 8 × cycle (Gary's +1): 1–8 on the first playthrough, 9–16 at NG+1, 17–24 at NG+2, so every
zone of a playthrough drops better gear than the playthrough before (D299). Base damage, defense and tool power rise with it (§3.1, §10).

Each weapon class has **three fixed skills** (CONTENT_ITEMS §4) on Q / E / R with cooldowns and stamina. **How many a
weapon has unlocked is rolled when it drops** (D89; D324: the cycle is read from the item level, so skill 2 never drops
before NG+1 and skill 3 never before NG+2):

| Where | Skill 1 (Q) | Skill 2 (E) | Skill 3 (R) |
|---|---|---|---|
| First playthrough, zones 1–3 | never | never | never |
| First playthrough, zones 4–8 | 20% → 60% | never | never |
| NG+1 | 64% → 92% | 10% → 45% (if Q) | never |
| NG+2 and later | always | 64% → 92% | 10% → 52% (+10% a cycle past NG+2) |

Legendaries add 20% to each step within the caps. Items from saves before D89 keep their item-level tiers.

### 8.4 Affixes, legendary powers, set perks

**Affixes** (CONTENT_ITEMS §6): flat and percent damage, elemental damage (Burning, Freezing, Shocking, Radiant,
Dusky), attack speed, cooldown reduction, Fleet (dodge recharge), stamina cost, lifesteal (D325, ×4 by D355: a share of max HP, × the hit's multiplier, once an attack however many it hits, rounded up and at least 1 HP (D337); not a share of the damage), status buildup, poise
damage, defense per type, max HP / stamina, Shard / Glowen / gem find, revive value, +stat.

**Legendary powers** (`data/legendaries.ts`) are unique effects on Legendary items (e.g. Joe's Lucky Socks: +1
Thermos maximum).

**Set perks** (D243, D245): any piece of gear can carry one of ten set perks — Counteroffer, Moonlight Flit,
Eviction, Squatter's Rights, Fine Print, Late Fees, Handyman, Demolition, Tea Break, Load-Bearing Wall (poise, D313). Wearing **3, 5 or 7** pieces with
the same one (every slot in use counts) gives a small, medium or large bonus to that playstyle. Drop chance: Uncommon
7.8%, Rare 14.3%, Epic 20.8%, Legendary 29.3%; Commons never.

**Special perks** of weapons and shields (Thorns, Bleed, Backstab, Riposte, Hyper armor, charged shot…) are listed on
the item card (D171).

### 8.5 Rings

Sixteen rings (`data/rings.ts`), each 0.8–1.5 weight (D237): Bands of Bonk / Slicey / Brain / Prayer / Vigor / Health,
the Lucky Charm (Shard find), Fleet Ring, Ring of Stillness, Chloranthy Knot, Glowcatcher, Red Thread, Ghost Lantern,
Thermos Lid, Slumlord's Signet, the Ballast Ring (poise, D313) and others. **Every copy worn counts** (D227).

### 8.6 Weight and equip load (D82, D163, D196)

Every item weighs 20% more than its table says (`ITEM_WEIGHT_MULT`). The load counts the weapon in hand, the off hand
in use, armor and rings (never the 2nd slots), against max equip load (§3.1):

| Tier | Load | Walk | Dodge distance | Dodge i-frames |
|---|---|---|---|---|
| Light | < 35% | ×1.1 | ×1.1 | ×1.2 |
| Medium | 35–70% | ×1 | ×1 | ×1 |
| Heavy | 70–100% | ×0.9 | ×0.8 | ×0.8 |
| Encumbered | > 100% | ×0.5 | ×0.5 | ×0.5 |

### 8.7 Weapon experience, rarity raising and proficiency (D178, D215, D218, D221)

Every enemy that dies gives each standing player experience on what they have **out** (weapon hand, and a staff,
talisman or shield in the off hand when not two-handing): fodder and swarms 1, others 2, Elites and mimics 5, bosses
30.

- **Item bars**: weapons, casting tools and shields fill a bar (Common 120, Uncommon 240, Rare 400, Epic 640). With a
  full bar, the bonfire's **Weapons** tab raises the item a rarity for Glowen (2 × (150 / 400 / 1,000 / 2,500) (D309) × (1 + 0.2 per
  item level above 1)); it keeps everything and its power moves to the new tier. Epic → Legendary rolls a legendary
  power and name.
- **Proficiency**: the same experience trains the item's class (each weapon base, Staffs, Talismans, and Small /
  Medium / Great Shields) to **level 100**, costing 20 + 3.1 × level a level. Odd levels raise its first perk, even
  levels its second (`data/proficiency.ts`), and perks work only while that class is out. An off-hand crossbow earns
  none (D294). The inventory's **Proficiency** tab lists every class.

### 8.8 Soul Essence and reinforcing (D198, D226, D285)

**Soul Essence** (five tiers: Tenant's Wisp, Lodger's Ember, Caretaker's Flame, Superintendent's Blaze, Freeholder's
Soul) is a counter on the character; it cannot be sold. **Where:** none in zones 1–3 of the first playthrough, Tier 1
from zone 4; NG+1 Tier 2 only, NG+2 Tier 3, NG+3 Tier 4, NG+4 and later Tier 5. **Drops:** enemies 1%, Elites 17.5%,
small chests 12.5%, mimics 25%, treasure chests 0.75 on average, bosses 1.5 on average.

**Reinforce** (bonfire tab): weapons, shields, armor, staffs and talismans go **+0 … +15**. Each step gives weapons,
staffs and talismans **+15%** damage / spell power (×3.25 at +15, D303), and armor and shields **+20%** (×4 at +15:
armor defense, and a shield's leak and block stamina shrink). Step `k` costs
1, 2, then 3 Essence of tier ⌊k / 3⌋ + 1 (six a tier) plus **320 × 1.45^k Glowen** (D309, D317: 3.2× what it once was). A higher tier pays for a lower
one 3:1 automatically; the tab's **Break down Essence** panel turns one of tier 2–5 into three of the tier below
(Convert 1 / Convert all). Reinforce shows before → after and asks first (D216, D220).

### 8.9 Gems (D92, D197, D227, D280–D286, D292)

Gems slot into sockets. **Weapons, staffs and talismans take weapon gems; armor and shields take armor gems.** A gem
carries **1–3 perks**, each a different family, each with its own **level (1–50)** and **quality roll (−50% …
+50%)**. There are **no tiers**:

```
perk strength = family baseline × level mult × (1 + roll)
level mult    = 0.25 at level 1 … 1 at about 14 … 3 at level 50 (even steps)
roll bands    = Green −50…−15% (55%) · Blue −15…+10% (30%) · Purple +10…+35% (11%) · Orange +35…+50% (4%)
```

| Family | Baseline | Kind |
|---|---|---|
| Quicksilver | +12% attack and cast speed | weapon |
| Tempo | −12% skill cooldowns | weapon |
| Fleetfoot | −0.6 s dodge recharge (3 s floor) | weapon |
| Brutal | +11% damage | weapon |
| Ember / Rime / Storm / Dawn / Dusk | **adds** 13.2% of the hit as Fire / Magic (frost) / Magic (lightning) / Holy / Void on top of it, with Burn / Chill / Shock buildup (D283, D292) | weapon |
| Leech | 1.6% of max HP healed a hit (lifesteal, D325; ×4 by D355) | weapon |
| Vigor | −16% stamina costs | weapon |
| Bulwark | +16 defense to all types | armor |
| Hearth | +8% max HP, applied after everything else (D260) | armor |
| Zephyr | +11.2% stamina regeneration (D356, was 16) | armor |
| Gilt | +11% Glowen found | armor |

Caps still hold (attack speed ×1.6, cooldowns −50%, dodge 3 s, stamina cost ×0.3).

- **Drops**: enemies **1.3%**, chests **7.8%**, bosses **65%** (D281), the bonfire shop (one one-perk gem per zone)
  and Gary. Drop level rises from about 1 in zone 1 to 50 by NG+3. **Perks by cycle**: one in the first playthrough;
  NG+1 35% two; NG+2 and later 40% two and 25% three. **Better rolls**: level 25+ gems roll quality twice and keep the
  best; treasure chests and bosses add a roll, Gary one or two.
- **Socketing** happens at the bonfire's Gem bench; picking an empty socket lists only the gems that fit it (D280).
  **Removing** a gem is free, anywhere, from the inventory's "Gems in your gear" list or the bench (D168).
- **Fusing**: a gem with 2+ perks can fuse with a loose gem of the same kind; you choose which perks the original
  keeps (as many as it had, no family twice, at least one from the other gem). A gem remembers its **original
  perks** (`Gem.origin`), and **every fuse must keep at least one of them**; afterwards only the original perks that
  were kept stay original (D286). Levels and rolls travel with their perks. Cost: twice the sale price of the best perk kept
  (at least 80; D309). The other gem is destroyed.
- **Selling**: a perk sells for 80 × its level mult × (1 + roll) (at least 5); a gem for the sum of its perks; the
  shop gem costs 6× its sale price (3× before D309's doubling). A gem can be **locked**; **Sell all gems** sells every loose, unlocked gem
  (D282). There is no re-rolling and no upgrading.

### 8.10 Selling, locking and item cards

- Gear sells for 10 / 25 / 60 / 150 / 400 Glowen by rarity × (1 + 0.3 per item level above 1), plus its gems.
  **Sell all** / all Commons / all below Rare take bag items only, never locked ones; socketed gems come back loose
  (D92, D265). Selling one item that holds gems asks whether to keep them (D240).
- Any item can be **locked** with the padlock in its slot corner or its shop row (Y / △ or L) (D265).
- **Item cards** (D171, D267, D294): a weapon's damage is the **hit you would really deal** with it equipped — every
  perk counted (stats, proficiency, rarity, reinforcement, its affixes and gems, set perks gained or lost by the swap,
  rings, the below-requirement penalty), per type, with a total (no damage per second, D305), compared with
  what you wear worked out the same way. Timed buffs are not counted. Weapon cards list only their **unlocked**
  skills; staff and talisman cards show their effective Spell Skill. Cards end with the item's special perks, set perk
  and sockets.

## 9. Bonfires, the Thermos and death

### 9.1 The bonfire

Tabs, in order: **Level up** · **Gem bench** · **Weapons** (rarity bars) · **Reinforce** · **Shop** ·
**Warp** (to any discovered bonfire of this playthrough) · **Bestiary** · **Spells** · **Inventory**.

**Resting** (D150, D152, D153, D177, D324): **every rest heals, refills the Thermos and clears statuses for the whole
party**, resets every player's revive downs and spell and weapon skill cooldowns, respawns the zone's enemies, autosaves and sets the
respawn point. A used fire burns down to embers on the map as a record of where you have been.

**Shop**: sell gear and gems (one by one, Sell all, all Commons, all below Rare); buy consumables, the zone's one-perk
gem and **one rotating gear piece** at the zone's item level (Rare or better in NG+), shown with full stats against
what you wear. Each zone and cycle has its own stock (D357), the same at every fire of it and across rests; the gem and
the piece change only once you buy one (the next is rolled at once) or when you move to another zone. In co-op a guest
buys from its own stock, rolled the same way and kept in its own save, as it has its own bag.

**Prices** (D309): everything bought with Glowen costs **twice** its listed price (`GLOWEN_PRICE_MULT`): consumables,
the shop gem (6× its sale value) and gear piece (8× its sale value, at least 200), all of Gary's stock (gear 10× its
sale value, at least 800; rings 900 × zone; a Tear 4,000 × zone), rarity raises and gem fusing. Reinforcing costs
**four times** (§8.8). Selling is unchanged, so Glowen is worth keeping.

### 9.2 Joe's Thermos

Heals 40% max HP (§3.1) over 1.5 s; the drink takes 1.2 s and you can be hit; gold sparkles rise while you drink
(D271). **Maximum charges**: 1 at the start, +1 for every 2 bosses beaten (max 5); Joe's Lucky Socks +1 (never above
5). Kept in NG+.

Charges come back in exactly **two** ways: **resting** at a bonfire (every rest, D150) and **dying** (you respawn
full). Nothing else restores a charge — no drop, shop item, spell or affix (a data test asserts it). Raising the
maximum and changing the heal are allowed.

### 9.3 Death (solo)

A death screen with a quip and a tip ("JOE DIED", "Joe has fallen down the stairs"…). Shards drop as a Shardpile.
You respawn at the last bonfire rested at with **full HP and a full Thermos**, spells ready; the zone's enemies
respawn (bosses, opened chests and killed mimics stay done). The map does not change.

## 10. Spells

- **Casting tools**: a **staff** casts **Brain** spells, a **talisman** **Prayer** spells. Each school has one
  loadout of **3 slots** on the character; any known spell meeting its requirement can be slotted, any time.
- **Keys** (D201): a tool in the **off hand** casts on 1 / 2 / 3; a tool in the **weapon hand** casts on Q / E / R
  (its weapon-skill keys, on the skill cooldowns). A staff and a talisman together: six spells on six keys. Two tools
  of the same school: the weapon hand's keys only.
- **Spell Skill** (D182): `100 × tool grade × (1 + 0.35 (ilvl − 1)) × rarity power × reinforcement × (1 + letter
  weight × f(Brain or Prayer) × m) × (1 + proficiency and set spell power)`, with letter weights as weapons (C 0.8 …
  S 1.9). Spells **deal and heal Spell Skill / 100 × their listed amounts**, and their damage (not heals) is ×1.4 while
  their school's stat is 30 or less, easing in a straight line to ×1 at 300 and after (D343: more early, the same late); other effects (buffs, barriers, durations)
  grow on a gentler curve (×1.5 at 270, at most ×3). Shown on tool cards, the inventory, the Level up preview and the
  Spells tab.
- Spells have a cast time (cast speed scales it; you walk slower while casting, §3.1), a cooldown and a stamina cost
  (§5.2). **Cooldowns only run while there is something to fight** in the room (D177), and every spell is ready after
  a rest or a death. Since D324 weapon skills (and an off-hand crossbow's) hold and reset the same way.
- Healing spells are slow: Heal 12.5% over 10 s (cooldown 50 s; D335), and it cannot be interrupted (D128, D250).
- Weapon buffs (Bless Weapon) need a weapon in the weapon hand (D131); a buffed weapon glows its element (D129).
- Spells are **learned** from spell reliquaries, sometimes bosses and The Instructor; never sold; known forever. A
  reliquary favours the school of your class's primary stat (×3) or secondary (×2) when it is Brain or Prayer (D317).
  14 Brain and 14 Prayer spells (CONTENT_SPELLS_CLASSES §1–2). Gravity Well pulls hovering enemies too, including
  Aurelia's ice mirrors, and deals no damage (D269, D270).
- Spells revive poorly (0.25 per hit), except Last Rites.

## 11. Chests, reliquaries, Gary and the Bestiary

- **Chests**: treasure rooms hold a chest of two items from the boss row; a quarter of combat rooms have a small chest
  standing in them from the start (D93). Opening takes a 0.6 s hold, possible mid-fight. Chests also give a little
  Glowen, a gem 7.8%, a consumable bundle 8%, and Essence (§8.8). 8% are mimics.
- **Spell reliquary**: holds one spell the character does not know (either school); 300 × zone Glowen when it knows
  them all (D341).
  Never a mimic.
- **Gary**, the wandering merchant (20% a zone from zone 2, D70): 3–5 entries rolled once per zone and cycle — gear at
  item level + 1 from Epic/Legendary weights (half of NG+ gear is Legendary), gems at 6× their sale price with
  better rolls, consumable bundles and a Lucky Charm ring. A detail pane shows
  full stats against your gear. Hit him three times and he leaves for the playthrough. Only the host trades in co-op.
- **Bestiary** (D229, D236): a bonfire tab with one collapsible chapter per zone (88 entries). Kills credit every
  standing player. A regular enemy unlocks its picture and name at 1 kill, its lore at 15, its resistances at 40,
  **+25% damage to it at 200** and **25% less damage from it at 500**; a boss its picture on first sight, lore at 1,
  resistances at 4, and both bonuses at 8.

## 12. Online co-op

- **Lobby** (D31, D74, D134): Title → **Co-op play** → Host / Join, or the Host / Join buttons on a character card.
  The host gets a **6-digit room code** (D76). **Joining happens only in the lobby**; Start puts everyone in the host's
  world at the host's last bonfire; "Return to lobby" brings the party back so more can join. Up to 4 players.
- **Authority** (NETCODE, D338): the host simulates the world (enemies, loot, rooms, revives, bonfires) and runs every
  player's skills, spells and consumables; each guest's own screen runs that guest's body (movement, dodges, blocks,
  parries, swings and the hits they land) and decides every enemy hit on it; guests own their inventory.
- **Scaling** (D159, D194): every extra player adds one full wave to every room; HP per extra player +75% for room
  enemies, +125% for Elites and bosses; boss poise +150%; damage unchanged. Elites come more often (§6.5). Shards and
  loot are instanced and divided so each player earns what they would solo.
- **Downed and revive** (D12, D202): at 0 HP a player becomes a ghost (90 px/s, cannot act) for 30 s. Teammates
  revive by **hitting the ghost**; each hit adds the weapon's revive value (greathammer 4 … daggers 0.8; spells 0.25;
  throwables 0.5) and holds the countdown for 3 s. Requirement 10 × 2^(downs − 1), max 40 (downs since the last
  rest). Revived at 40% HP with 2 s of i-frames (no Thermos refill). A ghost that bleeds out is dead until the party
  rests or wipes. Every player sees every ghost's countdown (D329). **Clearing the whole room** (not a wave) gets every
  ghost up at 40% HP, as a revive does (D329). **Everyone down** wipes the party: all wake at the host's bonfire full (the host's death screen moves
  on by itself after 3 s, D64).
- **Nobody leaves a ghost behind** (D115): while a player is down, doors and stairs refuse ("Revive *name* first!").
- **Safe out of combat** (D329): with nothing to fight in the room, a player takes no damage at all: no enemy hits,
  burn or bleed ticks, falls, harmful ground, or friendly fire.
- **Friendly fire** (D115): players' damaging attacks hit standing allies at Settings → Co-op → Friendly fire
  damage (0–200%, default 100%); the host's value rules the session. Your own attacks never hit you.
- **What a guest takes home** (D195): Shards, loot, levels, spells, gems, Glowen and Thermos upgrades always. Zone
  progress counts in the guest's own world only for zones that world had already reached, and then chains.
- Guests who disconnect are dropped after 10 s; the host sends save-relevant changes as they happen. No pause in
  co-op; cutscenes play as local overlays. Players must run the same version (§22).

### 12.1 Friends

- **Friends** (D339; title menu, and **Friends…** in the host's lobby): your **friend code** (`XXXXX-XXXXX`, one per
  browser, with Copy), a box to add a friend's code, and the list with a green dot for who is online and what they are
  doing (in the menus, playing solo, hosting a lobby, in a co-op game). Remove takes two presses. No accounts or servers.
- Friends see each other **once both have added the other's code**; nobody who is not on your list ever sees you
  online. **Appear online to friends** (on by default) turns it all off.
- **Invites:** the host's lobby lists **every** friend under **Invite friends** (online first), each with **Invite**,
  and an **Invite all** button (D351). An offline friend's invite waits ("Invited · when online") and reaches them as
  soon as they open the game while the lobby is still open. The friend gets a card on whatever screen they are on: *Host invites you to co-op in their world (zone)*, **Join** / **Decline**, 60 s.
  Join goes to that lobby as typing the code would (picking or making a character first from the title; a solo run is
  saved and left). The host sees "on the way", "declined" or "busy"; invites are withdrawn when the lobby closes or
  the game starts.
- The list lives in the browser (`dj.friends`), not in a character's save, so every character has the same friends.

## 13. New Game+

After The Landlord: credits, then a blue fire offers **Begin Cycle N+1** (D70). A new seed, zone 1, everything kept
(level, gear, spells, gems, Essence, Thermos maximum, Glowen); no Training Hall. What changes from NG+1:

- Enemy HP, damage and Shards on the NG+ curve (§2.3), room-enemy damage by zone, and zone 8's head counts in every
  zone (§6.3).
- **An Elite in every combat room** (§6.5); a **bonus boss room** in every zone (§7.5).
- **Third boss phases** in zones 1–7 and the Caretaker's **Last Rites** (§7.3).
- Item level +c; weapon skills roll E (NG+1) and R (NG+2) (§8.3); gems roll more perks and higher levels; Essence
  tiers step up (§8.8); the shop's gear is Rare or better; Gary's stock improves.

The title screen shows the cycle next to the character.

## 14. Saves

10 slots in `localStorage` (`dj.save.<n>`), JSON, save version 3 with a migration table and a sanitiser that cleans
every load (older gems lose their tiers, D284; repeated item ids are renewed, D232). Export to a `.dungeonjoe.json`
file and import from one. Autosave on rest, zone change, boss kill, level up, pickup (debounced), every 30 s and on
unload. Each character also carries its own pad layout (D266), Bestiary, proficiency and statistics. Settings
(`dj.settings`), achievements (`dj.achievements`) and account-wide statistics (`dj.stats`) are shared by every slot.

## 15. Classes

Ten classes (CONTENT_SPELLS_CLASSES §3 is the source of truth; every kit meets its own requirements, tested):

| Class | HP / End / Bonk / Slicey / Brain / Prayer | Primary / secondary | Kit |
|---|---|---|---|
| Knight | 10 / 10 / 12 / 9 / 3 / 4 | HP / Endurance | Longsword, Round Shield (D326) |
| Brute | 12 / 8 / 14 / 5 / 4 / 5 | Bonk / HP | Greathammer (two-handed) |
| Duelist | 8 / 11 / 5 / 14 / 5 / 5 | Slicey / Endurance | Twin Daggers, Buckler |
| Scholar | 7 / 7 / 3 / 10 / 15 / 6 | Brain / Slicey | Rapier, Apprentice Staff; Arcane Bolt, Frost Lance |
| Pyre Priest | 10 / 7 / 11 / 3 / 4 / 13 | Prayer / Bonk | Censer Flail, Wooden Talisman; Heal, Bless Weapon |
| Battlemage | 7 / 7 / 13 / 8 / 10 / 3 | Bonk / Brain | Colossal Sword two-handed (D329), Round Shield (D326), Apprentice Staff as 2nd weapon; Arcane Bolt, Scatter Shards |
| Hunter | 7 / 9 / 10 / 14 / 5 / 3 | Slicey / Bonk | Halberd (two-handed), a Bow and a Whip in the bag (D334) |
| Zealot | 8 / 8 / 3 / 12 / 3 / 14 | Prayer / Slicey | Blessed Katana (D349), Silver Talisman; Sunray, Bless Weapon |
| Berserker | 10 / 8 / 12 / 11 / 3 / 4 | Bonk / Slicey (D334) | Twin Axes (dual-wielded) |
| Nobody | 8 / 8 / 8 / 8 / 8 / 8 | none / every stat (D334) | Club, a loincloth, one random gem |

**Character creation**: name (blank = Joe, D200), class (a fixed-layout card, D188), optional seed, and an
**Appearance** panel (D100, D183): body (male / female), skin, hair, facial hair, eyes and eye colour, nose, brows,
face marks and per-limb features, with Randomize and a preview you turn with the right stick or a drag (D125).

## 16. UI and HUD

- **HUD**: HP and stamina bars top-left, with held-in-place controls (FROZEN, ROOTED…) and buffs under them; Thermos
  count; Shards and Glowen; minimap; co-op cards (name, HP, status, downed timer) along the left.
- **Skill circles** (Nightreign style, D321, D323): at the bottom middle, the three weapon skills (Q/E/R) and, past a short
  divider line, the three spells (1/2/3, or an off-hand crossbow's skills) as circles of the same size, the spells in
  pinkish purple; the quick-use item, smaller, to the skills' left. A circle
  on cooldown is greyed and fills from the bottom up like a rising liquid, with the seconds left in the middle; a cooldown
  paused with nothing to fight (D177) has a red rim and a soft red glow (D324); once full it takes the slot's colour, glows and pulses, flaring the moment
  it fills. Its name sits inside, its button glyph at its top left; locked slots show a lock. They fade while the player
  walks under them. The boss bar sits just above them.
- **In the world**: status buildup bars over the player's head (D321): one wide, see-through bar per status that is building
  or running, a small drawn picture of it (flame, snowflake, bolt, blood drop, bubbles) in a dark box at its left and
  the bar filled in its colour; once it goes off the bar runs down over the status's length, flashing (a meter building
  again under it shows as a thin white line). Near the top of the room they hang under the feet. Also an eye-coloured dot
  at every player's feet (D262); the dodge ring round the player; door torches (D263); gold immune enemies (§6.7); grey
  stones round a stuck player (D252); gold sparkles on a Thermos drink (D271).
- **Menus** are HTML overlays over the canvas: Title · Load Character · Character creation · Co-op play · Lobby · Friends (§12.1) ·
  Pause · Inventory (Items, Spells, Proficiency tabs; stats, paper doll, bag, gems in your gear, set perks worn) ·
  Bonfire (§9.1) · Map · Settings · Achievements · Statistics · Death screen · Credits. Menus keep their focus across
  redraws (D144).
- **Cutscenes** (D87, D112): zone entry (first visit per cycle) types 2–4 lines and waits for a button; boss intros
  and defeats as §7.1. Skippable; solo pauses under them; `?nocut` skips them.

## 17. Settings, platforms and installing

- **Settings tabs**: Video & accessibility (resolution, full screen, frame cap, screen shake, hitstop, damage numbers,
  colour-blind icon size, high-contrast telegraphs, full sharpness on high-DPI screens, D153) · Audio · Keyboard &
  mouse (bindings, hold or toggle block) · Gamepad (this character's layout, D266; button prompts Auto / Keyboard /
  Xbox / PlayStation, D85; aim assist; Steam Controller; touch controls) · Co-op (name, friendly fire) · Game
  (install, the offline download).
- **Browsers**: Chrome, Edge and Firefox on desktop (D235). **Phones and tablets** get an on-screen controller (two
  sticks and a full pad; Auto / Always / Off, size and opacity; D143).
- **Steam Controller** (D206, D208, D214): connected once through WebHID in Chrome / Edge; in Firefox, start the
  browser from Steam with the Gamepad layout.
- **Installing** (D135–D139): install Dungeon Joe as an app from Edge or Chrome (Settings → Game → Install), then
  add it to Steam as a non-Steam game; `icons/DungeonJoe.png` is its icon. **Offline** (D86, D133): a zip with one
  self-contained HTML file and a `Dungeon Joe.cmd` launcher; its saves are separate (Export / Import moves a
  character).

## 18. Glossary

Shards (XP currency) · Glowen (the money, §19) · Joe's Thermos (flask) · Shardpile (dropped Shards) · Bonfire (the
camp stove Joe sits at) · Red = "Crimson" · Piercing / Blue = "Spectral" · Soul Essence
(reinforcing) · Spell reliquary · Gary (the wandering merchant) · The Instructor (tutorial boss) · The Landlord (final
boss) · Cycle (NG+ count).

## 19. Story and Glowen

All story text lives in `src/data/story.ts` (premise, zone and boss lines, death quips, bonfire lines, tips, credits).
Tone (D14): the world is grim, the text is dry.

**Glowen** is the money: a pale, warm, faintly glowing ectoplasm that seeps out of everything alive or valuable. The
harder someone worked on a thing, the more Glowen soaked into it: a hand-forged sword holds a fortune, a plastic spoon
holds a smell.

- **Monsters** are full of Glowen scraped off something else; hit one hard enough and it seeps out.
- **Gear** sells by rarity and item level because rarer, harder-worked things soaked up more of their maker.
- **Gems** are Glowen that set hard under pressure.
- **Soul Essence** is what is left of somebody once the Landlord's staff have taken all their Glowen: the part that
  never paid rent.
- **Bonfires** were lit by the Joes who came down before; stalls by them take only Glowen. **Gary** pays no rent and
  never says where anything came from.
- Anything drained of its last Glowen goes **hollow**: Hollow Knights, the Hollow Forest, the Hollow Joes.

**The premise.** The Landlord, at the bottom of the Abyss, holds the deed to everything under the stairs; the small
print says the world above is a sublet. Rent is paid in Glowen, and he is foreclosing on the living world one glow at
a time. The lights went out in Joe's building, so Joe went down the stairs to find the fuse box. The stairs kept
going.

Each boss is a link in the rent chain: **The Caretaker** buries the dead and keeps their Glowen; **Mother Spore**
farms it in the dark; **The Bloatking** skims the rent that drains through the sewers; **Vexthorn** wears the Hollow
Forest's last Glowen as a lantern-heart; **Foreman Ignatius** runs a forge where fine things are made only to be
melted down; **Saint Aurelia** froze herself at the reliquary door to keep the collectors out and no longer knows Joe
isn't one; **Archmagister Tock** keeps the ledger of every drop owed; **The Landlord** collects. Beating him voids the
lease, every drop goes home, the fuse clicks back on, and the stairs go up. In NG+ the lights go out again a week
later: landlords always come back.

## 20. Achievements

**60** account-wide achievements (`src/data/achievements.ts`; D91, D199, D239), stored in `dj.achievements` and shared
by all ten slots. Kills (1 / 100 / 1,000 / 5,000), each boss and The Instructor, the credits, The Landlord on NG+ and
NG+2, a boss win with each class, deaths, mimics, a Legendary, a full armor set from zone 2 or deeper, a gem with an
Orange roll, a level-50 three-perk all-Orange gem, a +15 item, parries, ripostes, a Thermos-free boss, a boss with an
empty weapon hand, clean zones, revives, friendly-fire downs (hidden), a full party, levels 50 and 100, 10,000 Glowen,
a minute Encumbered, Gary, Bestiary milestones, raising a weapon to Legendary, a Legendary in every slot, and **The
Dark Shard** for all the rest. Some are hidden ("???") until unlocked. Each client tracks its own from world events,
so guests earn theirs. Unlocks show a toast and a bell; the Achievements screen is on the title and pause menus.

## 21. Statistics

About forty counters (D99), kept per character (`stats.extra`, travels with export) and account-wide (`dj.stats`),
counted on each client from world events: combat (kills by type and zone, Elites by affix, bosses with fastest kills,
damage dealt and taken, biggest hit, weakness and resisted hits, parries, ripostes, dodges, blocks, sips), death and
Shards (deaths by killer, falls, mimic bites, Shards gained / spent / dropped / recovered, Glowen), loot (items by
rarity, gems, chests, Gary), exploration (time, distance, rooms, bonfires, deepest zone, cycles) and co-op (time,
party size, revives, downs). The Statistics screen sits below Achievements, with "This character" and "All
characters" tabs and a headline strip (most hated enemy, nemesis, Shards donated to the floor…).

## 22. Tools: debug menu, balance report, version

- **Debug menu** (D29, D44): Ctrl+Shift+D asks for the owner's code, checked by SHA-256 only (the code is never in the
  repo). God mode, spawn, jump to zone or boss, give items, set level and cycle. On the dev server `?debug` opens it
  without the code.
- **Balance report** (D297): `npm run balance:report` writes `docs/balance/report.md` from the live data: enemy and
  boss curves, time to kill and hits to die for seven builds per zone, gems, weapons, spells, Shards and player
  growth, with a ranked Findings list. Every deploy shows it on the run's summary page. `npm run balance` plays bot
  campaigns (docs/BALANCE_REPORT.md).
- **Version** (D116, D132): `major.minor` from package.json plus the number of commits since that line last changed
  (v1.3.19 when this was written). Co-op players must match.

## 23. Not built

- Translations (all strings are in English; D36).
- A Steam store release (personal Steam play only, §17).
- A real `.exe` launcher (D133).
