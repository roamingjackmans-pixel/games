# Dungeon Joe — Spells and Classes

The current catalogue of the 28 spells and 10 classes, generated from `src/data/spells.ts` and `src/data/classes.ts`
(v1.3.19). The data files are the truth; if this page and the data disagree, the data wins. Mechanics are in
[GAME_DESIGN.md](GAME_DESIGN.md) §10 and §15.

## 1. How spells work

- **Learning.** Spells are learned from spell reliquaries (a spell you do not know, of either school; 5% a Tear of
  Undoing instead), including the one in each boss arena, and from the Instructor (50%). They are never sold.
- **Tools.** A staff casts Brain spells, a talisman Prayer spells; each tool holds three. A tool in the off hand casts
  on keys 1/2/3; in the weapon hand it casts on the weapon-skill keys Q/E/R (D201). A staff and a talisman together
  give six spells on six keys. Tools go in any of the four weapon slots (D117).
- **Requirement.** Every spell needs its school's stat (Brain or Prayer) at its requirement.
- **Power.** Damage and heal numbers below are the base. A spell deals and heals **Spell Skill / 100** times them
  (D182); its damage is also ×1.4 at 30 Brain / Prayer (its school's stat) or less, easing to ×1 at 300 and after (D343). Spell Skill = `100 × toolMult × rarity × reinforcement × (1 + grade × f(stat) × class boost) × (1 + spell
  power bonuses)`; see CONTENT_ITEMS §4. Buffs, barriers, durations and revive strength grow more gently (×1 at Spell
  Skill 100, about ×1.5 at 270, at most ×3). A tool's element bonus adds to spells of that element; the Saint's Relic
  adds to heals.
- **Stamina** is spent on cast; attacks, skills and spells need the full cost to start (D193).
- **Reviving.** Any damaging spell hit on a downed ally adds 0.25 revive value (D12); Last Rites is the reviving spell.

## 2. Brain spells (staff) — 14

| Spell | Req Brain | Cast | Cooldown | Stamina | Element | Effect |
|---|---|---|---|---|---|---|
| **Arcane Bolt** | 8 | 0.3 s | 1.2 s | 8 | void | A bolt of arcane force: 19.2 (counts as Void; D300: was 24). The bread and butter. |
| **Scatter Shards** | 10 | 0.4 s | 4 s | 14 | void | 5 shards in a 50° fan, 14 each. |
| **Frost Lance** | 12 | 0.5 s | 5 s | 16 | magic | line(30,420) 40 Magic, Chill 50. |
| **Fireball** | 14 | 0.6 s | 6 s | 18 | fire | A fireball: circle(100) 48 Fire, Burn 50, a puddle for 2 s. |
| **Blink** | 12 | 0.1 s | 10 s | 10 | — | Teleport 240 px toward the cursor. Not i-frames: it escapes Piercing areas if you land outside them. |
| **Chain Lightning** | 16 | 0.5 s | 7 s | 18 | magic | 36 Magic lightning that chains to 4 more enemies within 180 px (−15% per jump), Shock 40. |
| **Void Rift** | 15 | 0.7 s | 9 s | 22 | void | circle(120) at the cursor for 4 s: 12 Void per 0.5 s, enemies inside −20% speed. |
| **Gravity Well** | 20 | 0.6 s | 12 s | 22 | void | circle(160) for 3 s pulling non-bosses to its centre, ice mirrors and flyers too (bosses −20% speed). It deals no damage. |
| **Arcane Beam** | 22 | 0.1 s | 11 s | 30 | void | Channel 2 s: a line(52,700) beam that follows the cursor, 18 per 0.2 s; walk at 40%. |
| **Mirror Images** | 24 | 0.5 s | 18 s | 20 | — | Two decoys for 6 s that pull enemies within 250 px. |
| **Time Dilation** | 28 | 0.6 s | 20 s | 26 | — | circle(200) at the cursor for 5 s: enemies inside act at 60% speed (bosses 80%). |
| **Meteor** | 30 | 0.8 s | 16 s | 34 | fire | circle(170) at the cursor, lands after 1.5 s: 160 Fire, Burn 100, knockback. |
| **Overload** | 26 | 0.3 s | 30 s | 10 | — | Your next 3 spells within 8 s: +50% power and no cooldown. |
| **Comet Barrage** | 35 | 1 s | 22 s | 40 | fire | 8 comets within 260 px of the cursor over 2 s, 44 each, Burn 30. |

Notes: Frost Lance fades where it stops; it has no burst at the end (D268). Gravity Well only pulls; it deals no
damage and has no end burst (D270), and its pull reaches flyers and Saint Aurelia's ice mirrors (D269). Blink is not
i-frames: it escapes a Piercing area only if you land outside it.

## 3. Prayer spells (talisman) — 14

| Spell | Req Prayer | Cast | Cooldown | Stamina | Element | Effect |
|---|---|---|---|---|---|---|
| **Heal** | 8 | 1 s | 50 s | 20 | — | Heal yourself 12.5% of max HP over 10 s. Nothing interrupts it. (D335) |
| **Purify** | 10 | 0.5 s | 10 s | 12 | holy | You and allies within 140 px: clear all statuses; undead and void within 140 px take 30 Holy. |
| **Bless Weapon** | 12 | 0.6 s | 25 s | 14 | holy | 20 s: your weapon deals +20% as Holy; undead and void take +15% more. Needs a weapon in the weapon hand (D131). |
| **Regen Aura** | 12 | 0.8 s | 36 s | 18 | — | circle(180) around you for 20 s: allies inside heal 0.3% per second; it goes with you from room to room (D335, D350) |
| **Sunray** | 14 | 0.5 s | 6 s | 14 | holy | line(60,450) 36 Holy, reveals hidden and invisible enemies for 4 s. |
| **Ward of Steel** | 14 | 0.6 s | 20 s | 16 | — | 10 s: +30 defense to all types for you; allies within 140 px get +15. |
| **Last Rites** | 16 | 0.8 s | 6 s | 18 | — | On a ghost within 120 px: 3.0 revive value (6.0 with a Ghost Lantern). On a living ally: heals 10%. |
| **Haste** | 18 | 0.6 s | 24 s | 16 | — | 10 s: +15% attack and cast speed for you and allies within 140 px. |
| **Stone Skin** | 20 | 0.5 s | 22 s | 18 | — | 5 s of hyper armor and −20% physical damage taken. |
| **Spirit Shield** | 20 | 0.6 s | 20 s | 18 | — | A barrier absorbing 20% of max HP for 8 s on the ally under the cursor (or you). |
| **Guardian Wall** | 22 | 0.7 s | 16 s | 20 | — | A wall at the cursor for 6 s: blocks enemy projectiles and non-boss enemies; players pass. |
| **Fortify Thermos** | 24 | 0.5 s | 30 s | 10 | — | Your next flask drink within 20 s heals +50% and clears statuses. |
| **Martyr's Chain** | 28 | 0.8 s | 30 s | 22 | — | Link to the ally under the cursor for 12 s: damage either of you takes is split 50/50. |
| **Sanctuary** | 30 | 1.2 s | 80 s | 36 | — | circle(180) at the cursor for 8 s: statuses cannot build, allies heal 0.5%/s, enemies deal −20%. |

Notes: healing spells heal slowly and come back slowly (D128); Heal runs its full 20 s and nothing interrupts it
(D250). Bless Weapon and other weapon buffs need a weapon in the weapon hand (D131). Fortify Thermos makes a drink
stronger but never restores a Thermos charge (D38, D150).

## 4. Classes (D23)

Level 1. Starting gear is ilvl 1 Common; tools come with their spells already known. Every class starts with one
Thermos charge, 0 Shards, 0 Glowen and 3 Throwing Knives. **Primary and secondary stats** give ×1.25 and ×1.15 from
each point (D184); the **Nobody** has no primary and every stat secondary (×1.15 each, D334). Every class has 48 stat
points (D334: the Hunter too).

| Class (id) | HP | End | Bonk | Slicey | Brain | Prayer | Total | Primary / secondary | Weapon hand | Off hand | 2nd weapon | Armour | Spells | Bag | Blurb |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Knight** (`knight`) | 10 | 10 | 12 | 9 | 3 | 4 | 48 | hp / endurance | Longsword | Round Shield (D326) | — | Sexton's Coif, Sexton's Mail, Sexton's Chausses | — | — | "Took the job for the armour. The job came with stairs." |
| **Brute** (`brute`) | 12 | 8 | 14 | 5 | 4 | 5 | 48 | bonk / hp | Greathammer (two-handed) | — | — | Caretaker's Plate | — | — | "Solves things." |
| **Duelist** (`duelist`) | 8 | 11 | 5 | 14 | 5 | 5 | 48 | slicey / endurance | Twin Daggers | Buckler | — | Rag Hood, Crypt Rags, Rag Wraps | — | — | "Has never been hit. Says so." |
| **Scholar** (`scholar`) | 7 | 7 | 3 | 10 | 15 | 6 | 48 | brain / slicey | Rapier | Apprentice Staff | — | Rag Hood, Crypt Rags, Rag Wraps | Arcane Bolt, Frost Lance | — | "Read about dungeons once." |
| **Pyre Priest** (`cleric`) | 10 | 7 | 11 | 3 | 4 | 13 | 48 | prayer / bonk | Censer Flail | Wooden Talisman | — | Sexton's Mail, Sexton's Chausses | Heal, Bless Weapon | — | "Heals the faithful. Cremates the rest. Same sermon either way." |
| **Battlemage** (`spearman`) | 7 | 7 | 13 | 8 | 10 | 3 | 48 | bonk / brain | Colossal Sword | Round Shield (D326) | Apprentice Staff | Crypt Rags, Rag Wraps | Arcane Bolt, Scatter Shards | — | "Read one book on magic. Hit the librarian with a sword the size of the shelf." |
| **Hunter** (`hunter`) | 7 | 9 | 10 | 14 | 5 | 3 | 48 | slicey / bonk | Halberd (two-handed, D334) | — | — | Rag Hood, Crypt Rags, Rag Wraps | — | Bow, Whip | "Can track anything. Mostly tracks in mud." |
| **Zealot** (`occultist`) | 8 | 8 | 3 | 12 | 3 | 14 | 48 | prayer / slicey | Blessed Katana (B Slicey / C Prayer, Holy; D349) | Silver Talisman | — | Sexton's Coif, Sexton's Mail, Sexton's Chausses | Sunray, Bless Weapon | — | "Up at five to pray. Up at five past to stab whoever was not." |
| **Berserker** (`berserker`) | 10 | 8 | 12 | 11 | 3 | 4 | 48 | bonk / slicey (D334) | Twin Axes (two-handed) | — | — | Sexton's Mail, Sexton's Chausses | — | — | "Was asked to calm down once. Once. Has never been asked to count." |
| **Nobody** (`nobody`) | 8 | 8 | 8 | 8 | 8 | 8 | 48 | none / all six (D334) | Club | — | — | Loincloth | — | 1 gem | "Joe." |

- Every kit meets its own requirements at level 1, its 2nd weapon included, and no kit starts encumbered.
- The **Hunter** fights with a Halberd, Slicey first and Bonk second; its Bow and Whip wait in the bag, and it knows no
  spells (D334; it was a bow-and-spells kit, D184).
- The **Battlemage** starts two-handing its Colossal Sword (Bonk 19 needed, D329), the shield waiting for more Bonk, with the staff on the swap (D117, D119).
- The **Berserker** dual-wields the Twin Axes (two-handed) (D120, D123, D140).
- **Nobody** starts with one random level-1 gem in the gem pouch.
- Old class ids are kept for saves: `cleric` is the Pyre Priest (D118), `spearman` the Battlemage (D119),
  `occultist` the Zealot (D121).
- Each character keeps its own controller layout (D266).

## 5. What the data validation checks

1. Every spell has a school and a requirement ≥ 8; no spell is in both lists.
2. Every class's starting items meet its own starting stats (`tests/unit` class kit tests); its starting spells are
   known from the start.
