# Dungeon Joe — Spells and Classes

Source for `src/data/spells.ts` and `src/data/classes.ts`. Mechanics in [GAME_DESIGN.md](GAME_DESIGN.md)
§10 and §15. Spells are learned from spell reliquaries (and bosses 25%, the Instructor 50%), never sold.
A staff casts only Brain spells; a talisman casts only Prayer spells. Each tool has 3 slots. Every spell
has a stat **requirement** (D37). Damage and heal numbers below are `spellBase`; the only scaling is
GAME_DESIGN §3.1: `spellBase × (1 + 1.2 f(Brain)) × toolMult` (or `1.0 f(Prayer)` for heals), where
`toolMult` comes from the casting tool's grade and item level (CONTENT_ITEMS §6). Spells have no
caster-level scaling.

Revive value of any damaging spell hit on a ghost: **0.25** (D12). *Last Rites* is the exception.

## 1. Brain spells (staff) — 14

| Spell | Req Brain | Cast | CD | Stam | Effect |
|---|---|---|---|---|---|
| **Arcane Bolt** | 8 | 0.3 s | 1.2 s | 8 | proj(700) 24 Void-flavored arcane (counts as Void). The bread and butter. |
| **Scatter Shards** | 10 | 0.4 s | 4 s | 14 | 5 proj(600) in a 50° fan, 14 each. |
| **Frost Lance** | 12 | 0.5 s | 5 s | 16 | line(30, 420) 40 Frost, Chill 50. |
| **Fireball** | 14 | 0.6 s | 6 s | 18 | proj(520) → circle(100) 48 Fire, Burn 50, puddle 2 s. |
| **Blink** | 12 | 0.1 s | 10 s | 10 | Teleport 240 px toward the cursor. Instant reposition; it is **not** i-frames, so it *does* escape Piercing areas if the destination is outside them. |
| **Chain Lightning** | 16 | 0.5 s | 7 s | 18 | proj(900) 36 Lightning, chains to 4 enemies within 180 px (−15% per jump), Shock 40. |
| **Void Rift** | 15 | 0.7 s | 9 s | 22 | circle(120) at the cursor for 4 s: 12 Void per 0.5 s, enemies inside −20% speed. |
| **Gravity Well** | 20 | 0.6 s | 12 s | 22 | circle(160) for 3 s pulling non-boss enemies to its center (bosses −20% speed), then bursts 50 Void. |
| **Arcane Beam** | 22 | channel 2 s | 11 s | 30 | line(26, 700) beam following the cursor, 18 per 0.2 s. You can walk at 40% while channeling. |
| **Mirror Images** | 24 | 0.5 s | 18 s | 20 | 2 decoys (1 HP, 6 s) that taunt enemies within 250 px. |
| **Time Dilation** | 28 | 0.6 s | 20 s | 26 | circle(200) at the cursor 5 s: enemies inside act at 60% speed (bosses 80%). Telegraph timers inside slow accordingly. |
| **Meteor** | 30 | 0.8 s | 16 s | 34 | circle(170) at the cursor, lands after 1.5 s: 160 Fire, Burn 100, knockback. |
| **Overload** | 26 | 0.3 s | 30 s | 10 | Next 3 spells within 8 s: +50% power, no cooldown. |
| **Comet Barrage** | 35 | 1.0 s | 22 s | 40 | randomCircles(8, 70) within 260 px of the cursor over 2 s, 44 each, Burn 30. |

## 2. Prayer spells (talisman) — 14

| Spell | Req Prayer | Cast | CD | Stam | Effect |
|---|---|---|---|---|---|
| **Heal** | 8 | 1.0 s | 12 s | 20 | Self 25% maxHP over 2 s (interrupted by a stagger). |
| **Purify** | 10 | 0.5 s | 10 s | 12 | Self and allies within 140 px: clear all statuses; undead/void within 140 px take 30 Holy. |
| **Bless Weapon** | 12 | 0.6 s | 25 s | 14 | 20 s: your weapon deals +20% as Holy; undead/void take +15% more. |
| **Regen Aura** | 12 | 0.8 s | 18 s | 18 | circle(180) around you for 5 s: allies inside heal 3% per second. |
| **Sunray** | 14 | 0.5 s | 6 s | 14 | line(30, 450) 36 Holy, reveals hidden/invisible enemies for 4 s. |
| **Ward of Steel** | 14 | 0.6 s | 20 s | 16 | 10 s: +30 defense to all types for you (party within 140 px on cast gets +15). |
| **Last Rites** | 16 | 0.8 s | 6 s | 18 | On a **ghost** within 120 px: adds **3.0** revive value (6.0 with a Ghost Lantern). On a living ally: heals 10%. The one spell built for reviving. |
| **Haste** | 18 | 0.6 s | 24 s | 16 | 10 s: +15% attack and cast speed for you and allies within 140 px. |
| **Stone Skin** | 20 | 0.5 s | 22 s | 18 | 5 s hyper armor and −20% physical damage taken. |
| **Spirit Shield** | 20 | 0.6 s | 20 s | 18 | A barrier absorbing 20% maxHP for 8 s on the nearest ally (or self). |
| **Guardian Wall** | 22 | 0.7 s | 16 s | 20 | line(40, 200) wall at the cursor for 6 s: blocks enemy projectiles and non-boss movement; players pass. |
| **Fortify Thermos** | 24 | 0.5 s | 30 s | 10 | Next flask drink within 20 s heals +50% and clears statuses. |
| **Martyr's Chain** | 28 | 0.8 s | 30 s | 22 | Link to the ally under the cursor for 12 s: damage either of you takes is split 50/50. |
| **Sanctuary** | 30 | 1.2 s | 40 s | 36 | circle(180) at the cursor for 8 s: inside, statuses cannot build, allies heal 5% per second, enemies deal −20%. |

## 3. Classes (D23)

Level 1, 48 stat points. Starting ilvl 1 gear (Common unless noted); tools come with the listed spells
already known. Every class starts with 1 flask charge, 0 Shards, 0 Stardust, 3 Throwing Knives.

| Class | HP | Stam | Bonk | Slicey | Brain | Prayer | Main hand | Off hand | Armor | Spells known | Blurb |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Knight** | 10 | 8 | 10 | 9 | 4 | 7 | Longsword (req 9/9) | Kite Shield (req Bonk 10) | Medium set | — | "Took the job for the armor." |
| **Brute** | 12 | 8 | 14 | 5 | 4 | 5 | Greathammer (req Bonk 14; starts two-handed) | — | Heavy body only | — | "Solves things." |
| **Duelist** | 8 | 11 | 5 | 14 | 5 | 5 | Twin Daggers (req Slicey 14) | Buckler (req Slicey 8) | Light set | — | "Has never been hit. Says so." |
| **Scholar** | 7 | 7 | 3 | 10 | 15 | 6 | Rapier (req Slicey 10) | Apprentice Staff (req Brain 8) | Light set | Arcane Bolt (8), Frost Lance (12) | "Read about dungeons once." |
| **Cleric** | 10 | 7 | 11 | 3 | 4 | 13 | Mace (req Bonk 11) | Wooden Talisman (req Prayer 8) | Medium set | Heal (8), Bless Weapon (12) | "Prays mostly for himself." |
| **Spearman** | 9 | 9 | 9 | 10 | 5 | 6 | Spear (req 8/10) | Round Shield (req Bonk 8) | Medium set | — | "Keeps a polite distance." |
| **Hunter** | 8 | 12 | 5 | 12 | 6 | 5 | Bow (req Slicey 10) | — (a Whip, req Slicey 9, in the bag) | Light set | — | "Never misses. Rarely hits." |
| **Nobody** | 8 | 8 | 8 | 8 | 8 | 8 | Club (req Bonk 8) | — | Loincloth (legs only, 0 def) | — | One random T1 gem in the bag. "Joe." |
| **Berserker** | 10 | 10 | 11 | 10 | 3 | 4 | Twin Axes (req 10/10) | — | Medium body + legs | — | "Has two of everything except plans." |
| **Occultist** | 7 | 7 | 3 | 10 | 15 | 6 | Rapier (req Slicey 10) | Void Staff (req Brain 12) | Light set | Void Rift (15), Arcane Bolt (8) | "Found the staff in a dumpster. It found him back." |

Every kit meets its own requirements at level 1 (test §4.2). The Hunter's Bow is the main hand and the
Whip sits in the bag to swap; the inventory supports a quick main-hand swap (two weapon slots, toggled
with a bindable key; default none).

## 4. Validation tests

1. Every spell has a requirement ≥ 8 and a school; no spell appears in both lists.
2. Every class sums to 48 points and starts with items that meet its own requirements (except Nobody's
   bag gem, which is not equipment).
3. All starting spells meet the class's starting Brain/Prayer.
