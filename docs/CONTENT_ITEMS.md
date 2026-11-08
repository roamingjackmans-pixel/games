# Dungeon Joe — Items

The current catalogue of weapons, skills, shields, casting tools, armour, rings, affixes, legendary powers, set perks,
gems, consumables, loot, proficiency and reinforcement, generated from `src/data/*` (v1.3.19). The data files are the
truth; if this page and the data disagree, the data wins. Mechanics are in [GAME_DESIGN.md](GAME_DESIGN.md) §3, §5 and
§8. Names are plain, flavor lines dry.

## 1. Item levels, scaling and rarity

- **Item level** = zone + New Game+ cycle (zone 1 of the first playthrough is ilvl 1; zone 8 is 8; NG+1 zone 1 is 2).
  The bonfire shop sells at the zone's ilvl (Rare or better in NG+); Gary sells at +1 (half his stock Legendary in
  NG+).
- **Weapon base damage** = `base1 × (1 + 0.45 × (ilvl − 1))`. **Armour defense** = `def1 × slot × (1 + 0.6 × (ilvl −
  1))`. **Requirements** grow `+2 per ilvl` on the primary stat only.
- **Damage per hit** = base × (1 + Σ grade × f(stat)) × the swing's multiplier × rarity × reinforcement × your bonuses,
  40% below requirement. f(s) = 1 − 0.982^s; grade weights S 1.9, A 1.55, B 1.15, C 0.8, D 0.45, E 0.2. Two-handing
  counts Bonk ×1.5 (cap 99) for scaling and requirements (D72). Classes get ×1.25 from their primary stat and ×1.15
  from their secondary (D184). **Grades are spread from E to S on purpose (D40).**
- **Rarity power** (D178, D221): Common ×1, Uncommon ×1.06, Rare ×1.12, Epic ×1.2, Legendary ×1.28, on weapon damage,
  a casting tool's Spell Skill and a shield's block and stability. Armour defense does not depend on rarity.
- **Item cards** show the hit you would really deal with the item equipped: stats, proficiency, gems, affixes, set
  perks, rings and the rest of your gear, compared like for like with what you wear (D294). Timed buffs are not
  counted.
- **Weapon skills (D89):** each weapon rolls how many of its three skills it has when it drops. Before zone 4 none;
  from zone 4 some have skill 1 (Q); from NG+1 some also have skill 2 (E); from NG+2 some have all three (R).
  Legendaries roll a little better. A weapon card lists only the skills its item has unlocked (D267).
- **Locks (D265):** any item (and any gem, D282) can be locked; Sell all never sells a locked one.

## 2. Weapons

Combo timings in ms (windup / active / recovery) at base attack speed, the swing's damage multiplier and its hitbox.
`Base` = base1 at ilvl 1. Stamina per swing; poise damage per hit; revive value per hit on a downed ally (GAME_DESIGN
§12); equip-load weight.

| Weapon | Grades (Bonk / Slicey) | Req | Speed | Combo (windup/active/recovery ms ×mult hitbox) | Base | Stam | Poise | Revive | Weight | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **Greathammer** | S / - | 14 / 0 | veryslow | 550/150/500 ×1 arc(100°, 120); 650/150/600 ×1.3 thrust(70, 140) | 62 | 28 | 60 | 4 | 14 | hyper armor (all). *"For when the problem is a wall."* |
| **Greataxe** | A / - | 12 / 0 | slow | 450/140/400 ×1 arc(130°, 115); 450/140/400 ×1 arc(130°, 115); 600/160/550 ×1.4 arc(130°, 115) | 54 | 24 | 50 | 3.5 | 11 | hyper armor (last). *"Pure Bonk. The edge is mostly a formality."* |
| **Colossal Sword** | A / E | 13 / 8 | slow | 480/150/420 ×1 arc(150°, 130); 480/150/420 ×1.1 arc(150°, 130); 620/160/560 ×1.5 arc(150°, 130) | 56 | 25 | 50 | 3.5 | 16 | hyper armor (all). *"Not so much swung as committed to."* |
| **Crossbow** | B / - | 10 / 0 | slow | 120/60/700 ×1.4 proj(620) | 40 | 24 | 4 | 1.5 | 6.5 | either hand; in the off hand the block button shoots it (D291); volley of 3, 5° apart, each target hit once (D205, D264); pierces 1 with Bonk ≥ 30. *"Reloading is a lifestyle."* |
| **Club** | E / - | 8 / 0 | mediumslow | 380/120/360 ×1 arc(110°, 95); 450/130/420 ×1.2 arc(110°, 95) | 46 | 18 | 40 | 3 | 3 | hyper armor (all). *"Wood. It doesn't care how strong you are."* |
| **Twin Daggers** | - / S | 0 / 14 | veryfast | 150/80/150 ×0.5 arc(80°, 70); 150/80/150 ×0.5 arc(80°, 70); 150/80/150 ×0.5 arc(80°, 70); 150/80/190 ×0.7 arc(80°, 70) | 26 | 8 | 8 | 0.8 | 1.5 | Bleed 15 per hit; backstab ×1.5. *"Two is company. Three is a backstab."* |
| **Rapier** | - / A | 0 / 10 | fast | 200/90/200 ×0.8 thrust(28, 120); 200/90/200 ×0.8 thrust(28, 120); 300/100/320 ×1.2 thrust(28, 120) | 30 | 11 | 12 | 1.2 | 2.5 | ×1.5 on riposte-staggered. *"Pointy. Polite. Very rude after a parry."* |
| **Katana** | D / A | 7 / 12 | fast | 230/100/220 ×0.9 arc(120°, 110); 230/100/220 ×0.9 arc(120°, 110); 330/110/340 ×1.3 arc(120°, 110) | 34 | 12 | 15 | 1.5 | 5.5 | Bleed 20 per hit. *"Folded a thousand times. Like Joe."* |
| **Bow** | - / B | 0 / 10 | fast | 200/60/260 ×1 proj(700) | 28 | 20 | 2 | 0.6 | 3 | two hands only (D88); volley of 3, 5° apart, each target hit once (D205, D264); hold 0.6 s: ×1.8 charged, pierces 1. *"Never misses. Rarely hits."* |
| **Whip** | - / E | 0 / 9 | medium | 280/120/300 ×0.9 thrust(26, 220); 340/140/360 ×1.1 thrust(26, 220) | 40 | 12 | 10 | 1 | 2 | ignores front guards. *"Goes over shields. And under skin."* |
| **Longsword** | B / B | 9 / 9 | medium | 300/110/280 ×1 arc(110°, 105); 300/110/280 ×1 arc(110°, 105); 400/120/380 ×1.3 arc(110°, 105) | 38 | 15 | 25 | 2 | 6 | . *"A sword. Long."* |
| **Spear** | C / B | 8 / 10 | medium | 260/100/260 ×0.9 thrust(30, 150); 260/100/260 ×0.9 thrust(30, 150); 380/120/360 ×1.3 thrust(30, 150) | 38 | 14 | 20 | 2 | 5 | . *"Keeps a polite distance."* |
| **Battleaxe** | A / D | 11 / 7 | mediumslow | 340/120/320 ×1 arc(120°, 100); 340/120/320 ×1.1 arc(120°, 100); 450/140/430 ×1.4 arc(120°, 100) | 44 | 18 | 35 | 2.5 | 8 | hyper armor (all). *"Mostly Bonk, a pinch of Slicey. Gran’s recipe."* |
| **Mace** | B / E | 11 / 3 | mediumslow | 360/120/340 ×1.1 arc(100°, 95); 460/140/440 ×1.4 arc(100°, 95) | 46 | 18 | 45 | 3 | 5 | hyper armor (all); 20% Holy. *"Blessed by a priest who was in a hurry."* |
| **Halberd** | A / C | 10 / 10 | mediumslow | 340/130/340 ×1 arc(140°, 135); 340/130/340 ×1 thrust(30, 160); 480/150/460 ×1.4 arc(140°, 135) | 44 | 17 | 30 | 2.5 | 10 | hyper armor (all). *"An axe, a spear and a hook walked into a bar."* |
| **Twin Axes** | C / B | 10 / 10 | fast | 220/100/210 ×0.8 arc(100°, 90); 220/100/210 ×0.8 arc(100°, 90); 320/110/320 ×1.2 arc(100°, 90) | 34 | 12 | 18 | 1.5 | 6.5 | . *"Has two of everything except plans."* |
| **Hollow Maul** | B / - / Brain B | 12 / 0 / Brain 12 | slow | 500/150/450 ×1 arc(110°, 115); 500/150/450 ×1 arc(110°, 115); 620/160/580 ×1.4 thrust(70, 140) | 52 | 24 | 50 | 3.5 | 12 | void damage (hybrid, D80); hyper armor (last). *"There is nothing inside. It is very heavy anyway."* |
| **Spellblade** | - / B / Brain B | 0 / 10 / Brain 12 | medium | 290/110/270 ×1 arc(110°, 105); 290/110/270 ×1 arc(110°, 105); 380/120/360 ×1.3 thrust(34, 150) | 36 | 14 | 22 | 2 | 5.5 | magic damage (hybrid, D80). *"Sharp on one edge, smug on the other."* |
| **Censer Flail** | B / - / Prayer B | 11 / 0 / Prayer 11 | mediumslow | 340/130/330 ×1 arc(140°, 110); 340/130/330 ×1.05 arc(140°, 110); 460/150/440 ×1.35 arc(300°, 115) | 44 | 18 | 35 | 2.5 | 7.5 | fire damage (hybrid, D80); hyper armor (last). *"Smells like church. Hits like the fire that took the church."* |
| **Dawn Glaive** | - / B / Prayer B | 0 / 11 / Prayer 11 | mediumslow | 320/120/320 ×1 arc(140°, 130); 320/120/320 ×1 thrust(30, 165); 460/140/440 ×1.35 arc(160°, 135) | 42 | 16 | 28 | 2.5 | 9 | holy damage (hybrid, D80). *"A morning person. On a stick."* |

**Either-hand weapons.** Staffs and talismans (D117) and the crossbow (D291) go in any of the four weapon slots. A
crossbow in the off hand shoots on the block button with its own power and stamina; with it there is no block or
parry. A staff or talisman in the weapon hand swings a modest bash (staff: base 7, Bonk D / Brain E; talisman: base
5.6, Bonk E / Prayer D, 25% Holy) and casts on the weapon-skill keys (D201).

**Legendary names** (one picked per Legendary weapon): Greathammer: "Landlord's Gavel", "Noise Complaint", "The Big One"; Greataxe: "The Severance Package", "Lumberjack Retirement Plan", "Firewood"; Colossal Sword: "Overcompensation", "The Door", "Small Talk"; Crossbow: "Second Opinion", "The Notary", "Quarrelsome"; Club: "Stick of Destiny", "Problem Solver", "Original Recipe"; Twin Daggers: "Paper Cut", "The Fine Print", "Mr. and Mrs. Stabby"; Rapier: "Strongly Worded Letter", "En Garde", "The Point"; Katana: "Moonlight Shift", "Overtime", "Folded Laundry"; Bow: "Long Distance Relationship", "Return to Sender", "Cupid Retired"; Whip: "Middle Management", "The Long Reach", "Snap Decision"; Longsword: "Employee of the Month", "Plot Armor", "Exactly As Long As It Needs To Be"; Spear: "Social Distancing", "The Ten-Foot Rule", "Personal Space"; Battleaxe: "Hostile Takeover", "Chopping Block", "Axe Me Anything"; Mace: "Sunday Best", "Thoughts and Prayers", "The Sermon"; Halberd: "Committee Decision", "Swiss Army Pole", "The Long Arm of the Law"; Twin Axes: "Double Shift", "Twice Shy", "The Twins"; Hollow Maul: "Dark Matter of Fact", "Existential Dread", "The Void Warranty"; Spellblade: "Spell Check", "Sharp Mind", "Wizard of Odds"; Censer Flail: "Holy Smokes", "Fire and Brimstone Inc.", "Smoke Alarm"; Dawn Glaive: "Morning Person", "Sunday Service", "Rise and Shine".

### 2.1 Weapon skills (Q / E / R)

Multipliers are × the weapon's hit. Cooldown in seconds, then stamina.

| Weapon | Q (skill 1) | E (skill 2) | R (skill 3) |
|---|---|---|---|
| Greathammer | **Earthshaker** cd 10, 30: Slam the ground: circle(140) ×2.2, knockback, guaranteed stagger. | **Meteor Lunge** cd 14, 35: Leap to the cursor (i-frames vs Red, not Piercing) and land circle(120) ×2.5. | **Unstoppable** cd 24, 20: 6 s of hyper armor, +20% damage, −30% damage taken. |
| Greataxe | **Cleave Spin** cd 9, 26: Spin: 360° ×1.6. | **Execute** cd 15, 30: thrust(60,150) ×1.5; ×3.5 below 25% HP; a kill refunds half the cooldown. | **Bloodlust** cd 22, 15: For 8 s each kill grants +10% damage (max 5) and 3% HP. |
| Colossal Sword | **Guillotine** cd 12, 32: Overhead thrust(80,220) ×2.6, poise damage 120. | **Stomp** cd 10, 20: ring(0,170) ×0.8, staggers everything that is not a boss. | **Charged Swing** cd 16, 40: Hold up to 1.5 s, release arc(140°,200) ×1.5 → ×4.0; hyper armor while charging. |
| Crossbow | **Piercing Bolt** cd 8, 18: line(24,800) through everything ×2.0. | **Explosive Bolt** cd 12, 22: A bolt that explodes: circle(100) ×1.8 Fire, Burn 40. | **Rapid Fire** cd 18, 30: 5 bolts in 1.2 s ×1.0 each, no reload. |
| Club | **Bonk** cd 8, 22: Overhead ×2.0, guaranteed stagger (bosses take 2× poise). | **Wild Swing** cd 11, 26: arc(270°,110) ×1.3. | **Tantrum** cd 20, 15: +30% attack speed and +20% poise damage for 6 s. |
| Twin Daggers | **Shadow Step** cd 9, 14: Dash 200 px through the aim, ×1.2 on entry and exit; ends behind the target. | **Fan of Knives** cd 10, 16: 6 knives in a 60° fan ×0.7, Bleed 15 each. | **Flurry** cd 16, 24: 8 hits in 1.2 s ×0.6, rooted, hyper armor. |
| Rapier | **Lunge** cd 7, 16: Dash-thrust(30,260) ×1.8. | **Riposte Stance** cd 14, 12: 1 s stance: any non-Red hit is parried and riposted ×2 (no shield needed). | **Thousand Cuts** cd 18, 26: 5 thrusts in 0.9 s ×1.0, Bleed 20 each. |
| Katana | **Iai Slash** cd 10, 20: 0.5 s sheath (hyper armor), then thrust(60,260) ×2.4. | **Crescent** cd 9, 18: A wave of steel (500 px/s) through enemies ×1.3. | **Blood Moon** cd 20, 15: 8 s: Bleed buildup ×2, Bleed bursts +50%. |
| Bow | **Volley** cd 10, 18: Five arrows rain around the cursor after 0.8 s ×1.2. | **Piercing Shot** cd 8, 16: line(20,900) ×2.0. | **Rain** cd 20, 30: 12 arrows over 3 s on circle(180) at the cursor ×0.8 each. |
| Whip | **Lash** cd 7, 14: thrust(30,260) ×1.6, pulls non-boss enemies to you. | **Crack** cd 10, 18: cone(60°,250) ×1.2, staggers, Shock 30. | **Serpent Coil** cd 16, 24: 3 s spin: 360° r180 ×0.5 every 0.4 s, moving at 60%. |
| Longsword | **Shield Breaker** cd 8, 18: thrust(40,160) ×1.8, ignores front guards, +100 poise damage. | **Spin Slash** cd 11, 22: 360° ×1.4. | **Battle Cry** cd 20, 10: Party +15% damage and +20 poise for 8 s. |
| Spear | **Impale** cd 8, 18: thrust(30,220) ×2.0, roots non-bosses 1 s. | **Sweep** cd 10, 20: arc(300°,150) ×1.2, knockback 120. | **Phalanx** cd 18, 10: 4 s: two-hand guard blocks 80% physical / 40% elemental, and you can thrust while guarding. |
| Battleaxe | **Cleave** cd 8, 20: arc(140°,130) ×1.8. | **Hook** cd 12, 18: thrust(40,180) ×1.2, pulls, Bleed 30. | **Frenzy** cd 20, 15: +25% attack and move speed for 6 s. |
| Mace | **Holy Smite** cd 9, 22: circle(90) ×2.0 Holy in front of you. | **Consecrate** cd 15, 20: circle(160) for 6 s: allies inside +20% Holy damage and heal 2%/s; undead inside take ×0.3 per second. | **Judgment** cd 20, 30: Overhead ×1.6; ×3.0 against staggered or riposte-staggered enemies. |
| Halberd | **Moulinet** cd 9, 24: Two 360° sweeps ×1.3 each over 1 s. | **Hook Pull** cd 12, 18: thrust(40,200) ×1.2, pulls. | **Vault** cd 12, 20: Leap 260 px (i-frames vs Red, not Piercing), land thrust(60,120) ×1.5. |
| Twin Axes | **Whirlwind** cd 12, 26: 2 s spin: 360° r110 ×0.6 every 0.3 s, moving at 80%. | **Throw** cd 8, 14: Two axes ×1.2 that come back (hit twice). | **Rampage** cd 22, 10: 10 s: kills reset Throw and grant +5% attack speed (max 5). |
| Hollow Maul | **Singularity** cd 12, 28: Open a hole at the cursor: pulls foes within 200 px in for 0.6 s, then crushes circle(110) ×1.9. | **Event Horizon** cd 15, 24: Slam circle(120) ×1.2 and leave a void for 4 s: foes inside are 35% slower and take ×0.3 every 0.5 s. | **Null Shell** cd 22, 15: A shell of nothing: a barrier of 25% max HP for 6 s and 3 s of hyper armor. |
| Spellblade | **Arc Wave** cd 8, 18: Fling the edge: a magic wave (560 px/s) through enemies ×1.4. | **Blink Strike** cd 11, 18: Blink 220 px toward the cursor and strike circle(95) ×1.7. | **Runic Edge** cd 20, 15: The runes wake: +25% damage and +25% cast speed for 8 s. |
| Censer Flail | **Incense** cd 14, 20: Swing the censer: a 130 px cloud of burning incense follows you for 4 s, ×0.35 Fire and Burn 15 every 0.5 s. | **Brimstone** cd 11, 22: Lob a coal from the censer: it bursts circle(110) ×1.9 Fire, Burn 45. | **Sanctified Flame** cd 22, 15: Breathe in the holy smoke (not recommended): heal 15% over 3 s and +15% damage for 6 s. |
| Dawn Glaive | **Sunrise** cd 9, 22: A rising half-moon arc(180°,160) ×1.8 that knocks foes back. | **Halo Throw** cd 10, 18: Throw the blade like a halo: ×1.2 Holy out and ×1.2 back. | **Judgement Ray** cd 18, 28: Point at the problem: after 0.5 s a ray of dawn line(88,700) ×2.4 Holy. |

## 3. Shields

Block values are at ilvl 1 and rise +1% physical / +1.5% elemental per ilvl above 1 (caps 100% / 85%). Rarity and
reinforcement tighten what gets through (`1 − (1 − block) / (rarity × reinforcement)`) and divide the stability cost.
Stability = stamina lost per 100 damage blocked. A shield with no parry window cannot parry (D130).

| Shield | Size | Req Bonk / Slicey | Physical | Elemental | Stability | Parry | Weight | Notes |
|---|---|---|---|---|---|---|---|---|
| **Buckler** | small | 0 / 8 | 60% | 20% | 45 | 0.18 s | 1.5 |  *"Best parry. Worst everything else."* |
| **Targe** | small | 6 / 6 | 70% | 30% | 40 | 0.16 s | 2.5 |  *"A buckler that went to the gym."* |
| **Round Shield** | medium | 8 / 0 | 80% | 35% | 30 | 0.12 s | 4 |  *"Round. As advertised."* |
| **Kite Shield** | medium | 10 / 0 | 88% | 45% | 28 | 0.1 s | 5 |  *"Does not fly. Was asked."* |
| **Heater Shield** | medium | 12 / 0 | 90% | 50% | 26 | — | 5.5 |  *"Not a heater. Do not ask again."* |
| **Tower Greatshield** | great | 18 / 0 | 100% | 55% | 18 | — | 13 | walk ×0.9 while raised *"A wall with a handle."* |
| **Spiked Greatshield** | great | 20 / 0 | 100% | 65% | 20 | — | 12 | blocking a melee hit returns ×0.5 *"Hugging it is a mistake."* |
| **Holy Bulwark** | great | 22 / 0 | 100% | 60% (Holy/Void 80%) | 16 | — | 12 | blocking heals 1%; Legendary only *"Every blow it stops does you a little good. Saintly, if smug."* |

## 4. Casting tools

**Spell Skill** (D182) is one number for what a tool makes of your Brain or Prayer: `100 × toolMult × rarity ×
reinforcement × (1 + grade × f(stat) × class boost) × (1 + spell power bonuses)`, with `toolMult = grade value × (1 +
0.35 × (ilvl − 1))` and the grade weights of §1 for the letter. Spells deal and heal Spell Skill / 100 × their listed
amounts; their other effects grow more gently. A tool's bonus adds its % to spells of its element (or to heals). Cast
speed scales cast times. A staff casts only Brain spells, a talisman only Prayer spells; each holds three.

| Tool | School | Req | Grade | Cast speed | Weight | Bonus |
|---|---|---|---|---|---|---|
| **Apprentice Staff** | Brain (staff) | 8 | C 0.9 | 1 | 2.5 | — *"Scholar's start. Still has the price tag."* |
| **Arcane Staff** | Brain (staff) | 14 | B 1 | 1 | 3 | — *"Hums when nobody is listening."* |
| **Void Staff** | Brain (staff) | 12 | B 1 | 1 | 3 | void spells +20% *"Found in a dumpster. It found him back."* |
| **Storm Staff** | Brain (staff) | 16 | B 1 | 1.1 | 3.5 | magic spells +20% *"Do not hold it during weather."* |
| **Archmagister's Rod** | Brain (staff) | 24 | S 1.25 | 1.15 | 2 | — *"Tock left it on the counter."* |
| **Wooden Talisman** | Prayer (talisman) | 8 | C 0.9 | 1 | 0.5 | — *"Pyre Priest's start. Whittled during a sermon, then lightly singed."* |
| **Silver Talisman** | Prayer (talisman) | 14 | B 1 | 1 | 0.8 | — *"Tarnishes near liars. Always tarnished."* |
| **Sunlight Talisman** | Prayer (talisman) | 20 | A 1.1 | 1.05 | 1 | holy spells +20% *"Praise it. It likes that."* |
| **Saint's Relic** | Prayer (talisman) | 26 | S 1.25 | 1.15 | 1.5 | heals +15% *"A finger bone, still warm with Glowen. Whose, nobody says."* |

## 5. Armour

Three slots: head, body, legs. Each piece's defense = the weight class's base × the slot multiplier (head 0.8, body
1.4, legs 0.8) × `(1 + 0.6 (ilvl − 1))`. Damage taken = `incoming × 100 / (100 + defense)`. Weight class also sets the
equip load (D82; each set is 0.85–1.15× of the class weight).

| Weight | Physical | Magic | Fire | Holy | Void | Piece weight (head / body / legs) |
|---|---|---|---|---|---|---|
| light | 4 | 7 | 7 | 6 | 6 | 1.2 / 3.6 / 1.8 |
| medium | 7 | 5 | 5 | 4 | 4 | 2.8 / 7.2 / 3.6 |
| heavy | 11 | 3 | 3 | 2 | 2 | 5 / 12 / 7 |

Sets by zone and weight (24 sets; any can drop anywhere at the zone's ilvl):

| Zone | Light | Medium | Heavy |
|---|---|---|---|
| 1 | **Crypt Rags** (Rag Hood, Crypt Rags, Rag Wraps) | **Sexton's Mail** (Sexton's Coif, Sexton's Mail, Sexton's Chausses) | **Caretaker's Plate** (Caretaker's Helm, Caretaker's Plate, Caretaker's Greaves) |
| 2 | **Spore-Silk Wraps** (Spore-Silk Cowl, Spore-Silk Wraps, Spore-Silk Leggings) | **Mycelial Brigandine** (Mycelial Cap, Mycelial Brigandine, Mycelial Tassets) | **Cap-Shell Plate** (Cap-Shell Helm, Cap-Shell Plate, Cap-Shell Greaves) |
| 3 | **Sewer Waders** (Sewer Bandana, Sewer Vest, Sewer Waders) | **Rat-Catcher's Mail** (Rat-Catcher's Cap, Rat-Catcher's Mail, Rat-Catcher's Boots) | **Drowned King's Plate** (Drowned Crown, Drowned King's Plate, Drowned King's Greaves) |
| 4 | **Glade Leathers** (Glade Hood, Glade Leathers, Glade Breeches) | **Huntsman's Brigandine** (Huntsman's Cap, Huntsman's Brigandine, Huntsman's Leggings) | **Antlerguard Plate** (Antlerguard Helm, Antlerguard Plate, Antlerguard Greaves) |
| 5 | **Cultist Robes** (Cultist Cowl, Cultist Robes, Cultist Skirts) | **Smith's Apron Mail** (Smith's Cap, Smith's Apron Mail, Smith's Boots) | **Forgeplate** (Forge Helm, Forgeplate, Forge Greaves) |
| 6 | **Choir Vestments** (Choir Mitre, Choir Vestments, Choir Slippers) | **Wraithwatch Mail** (Wraithwatch Helm, Wraithwatch Mail, Wraithwatch Chausses) | **Saint's Ice Plate** (Saint's Ice Helm, Saint's Ice Plate, Saint's Ice Greaves) |
| 7 | **Magister's Robes** (Magister's Hat, Magister's Robes, Magister's Hose) | **Cogwork Brigandine** (Cogwork Cap, Cogwork Brigandine, Cogwork Greaves) | **Juggernaut Plate** (Juggernaut Helm, Juggernaut Plate, Juggernaut Greaves) |
| 8 | **Lessee's Suit** (Lessee's Hat, Lessee's Suit, Lessee's Slacks) | **Abyssal Scale** (Abyssal Helm, Abyssal Scale, Abyssal Greaves) | **Foreclosure Plate** (Foreclosure Helm, Foreclosure Plate, Foreclosure Greaves) |

Armour rolls affixes and up to one socket (armor gems only).

## 6. Rings (four slots, D228)

Rings have no ilvl scaling except the bands' stat amount. A ring's floor is the lowest rarity it can roll at.

| Ring | Floor | Effect | Weight |
|---|---|---|---|
| **Lucky Charm** | uncommon | +10% Shard find. | 0.7 |
| **Thermos Lid** | rare | Flask heals +15%. | 1.1 |
| **Band of Bonk** | rare | +3 Bonk (+5 Epic, +8 Legendary). | 1.25 |
| **Band of Slicey** | rare | +3 Slicey (+5 Epic, +8 Legendary). | 0.8 |
| **Band of Brain** | rare | +3 Brain (+5 Epic, +8 Legendary). | 0.8 |
| **Band of Prayer** | rare | +3 Prayer (+5 Epic, +8 Legendary). | 0.8 |
| **Band of Vigor** | rare | +3 Stamina (+5 Epic, +8 Legendary). | 0.9 |
| **Band of Health** | rare | +3 HP (+5 Epic, +8 Legendary). | 0.9 |
| **Fleet Ring** | rare | −0.5 s dodge recharge. | 0.7 |
| **Ring of Stillness** | epic | Standing still 1 s grants +15% damage. | 1 |
| **Chloranthy Knot** | epic | +20% stamina regen. | 0.8 |
| **Glowcatcher** | epic | +25% gem drop chance, +20% Glowen. | 1 |
| **Red Thread** | legendary | Blocking is impossible; Red attacks deal −25% to you. | 0.7 |
| **Ghost Lantern** | legendary | Your hits on ghosts count double for reviving. | 1.1 |
| **Slumlord's Signet** | legendary | +15% damage, −15% max HP. | 1.2 |

## 7. Legendary powers

A Legendary item carries one power from its row (Legendary rings are the named rings with a Legendary floor; they
carry no extra power).

| Power | On | Effect |
|---|---|---|
| **Mirror Face** | shield | Parried projectiles return with ×2 damage. |
| **Warden** | shield | Each blocked hit heals allies within 120 px by 1% of their max HP. |
| **Unyielding** | shield | Stability costs −40%; cannot be guard-broken by hits under 10% of your max HP. |
| **Echo** | staff, talisman | 10% chance a cast repeats itself for free 0.4 s later. |
| **Font** | staff, talisman | Spells cost no stamina while you are above 80% HP. |
| **Litany** | talisman | Your heals also restore 10% stamina to their targets. |
| **Overcharge** | staff | Spells deal +25% but you take +10% damage. |
| **Thunderclap** | weapon | Every 4th hit chains Lightning to 3 enemies ×0.8. |
| **Sunder** | weapon | Skills ignore 30% of enemy defense. |
| **Second Wind** | weapon | A kill refunds 20 stamina. |
| **Hungering** | weapon | +4% lifesteal, −10% max HP. |
| **Momentum** | weapon | Each consecutive hit without being hit: +3% damage (max 10). |
| **Riposte Master** | weapon | Ripostes deal ×4 and heal 5%. |
| **Spellsword** | weapon | Spells cast within 2 s after a light attack cost no stamina. |
| **Timekeeper** | weapon | Dodge recharge −1 s (floor 3 s). |
| **Mimic's Tooth** | weapon | Chests have a 0% mimic chance; mimics you attack first take ×2. |
| **Moss Mantle** | armor, legs | Statuses build 40% slower. |
| **Hollow Guard** | armor, legs | Below 30% HP: −30% damage taken. |
| **Coward's Comfort** | armor, legs | Dodging grants 1 s of +40% move speed. |
| **Joe's Lucky Socks** | legs | +1 flask charge (not above 5). |

## 8. Affixes

Rolled by rarity (count in GAME_DESIGN §8.2), no repeats on one item. Flat values scale ×(1 + 0.2 (ilvl − 1));
percentages are fixed.

| Affix | Position | Slots | Range | Scales with ilvl |
|---|---|---|---|---|
| **Brutal** | prefix | weapon | +4–12% damage | no |
| **Heavy** | prefix | weapon | +3–10 physical damage | yes |
| **Burning** | prefix | weapon | +4–12 fire damage, Burn buildup (10–25 buildup) | yes |
| **Freezing** | prefix | weapon | +4–12 magic damage (frost), Chill buildup (10–25 buildup) | yes |
| **Shocking** | prefix | weapon | +4–12 magic damage (lightning), Shock buildup (10–25 buildup) | yes |
| **Radiant** | prefix | weapon | +4–12 holy damage (10–25 buildup) | yes |
| **Dusky** | prefix | weapon | +4–12 void damage (10–25 buildup) | yes |
| **Swift** | prefix | weapon | +4–10% attack speed | no |
| **Hasty** | prefix | weapon, ring | −4–12% skill cooldowns | no |
| **Fleet** | prefix | legs, ring | −0.3–0.6 s dodge recharge | no |
| **Frugal** | prefix | weapon, body | −5–12% stamina costs | no |
| **Leeching** | prefix | weapon | 1–3% lifesteal | no |
| **Crushing** | prefix | weapon | +10–30% poise damage | no |
| **Warded** | prefix | armor | +3–9 defense to all types | yes |
| **Fireproof** | prefix | armor | +40% fire defense | no |
| **Spellproof** | prefix | armor | +40% magic defense | no |
| **Hallowed** | prefix | armor | +40% holy defense | no |
| **Voidtouched** | prefix | armor | +40% void defense | no |
| **Hearty** | prefix | armor | +15–45 max HP | yes |
| **Enduring** | prefix | armor | +6–18 max stamina | yes |
| **Lucky** | prefix | ring, head | +5–15% Shard find | no |
| **Glowing** | prefix | ring, head | +10–30% Glowen find | no |
| **of the Medic** | suffix | weapon | +0.5–1.5 revive value per hit | no |
| **of the Bonker** | suffix | any | +1–3 Bonk | no |
| **of the Slicer** | suffix | any | +1–3 Slicey | no |
| **of the Thinker** | suffix | any | +1–3 Brain | no |
| **of the Pious** | suffix | any | +1–3 Prayer | no |
| **of the Enduring** | suffix | any | +1–3 Endurance | no |
| **of the Hale** | suffix | any | +1–3 HP | no |
| **Steadfast** | prefix | shield | −10–25% stamina per block | no |
| **Reflective** | prefix | shield | +10–20% elemental block | no |

## 9. Set perks (D243)

Any piece of gear may carry a set perk. Wearing 3, 5 or 7 worn pieces with the same one (weapon, off hand, head, body,
legs, the four rings; only gear whose requirements you meet) gives the small, medium or large step; each step replaces
the one before. Chance a piece rolls one (D245): common 0%, uncommon 7.8%, rare 14.3%, epic 20.8%, legendary 29.3%.

| Set perk | Style | 3 pieces | 5 pieces | 7 pieces |
|---|---|---|---|---|
| **Counteroffer** | Parry and block | −10% stamina lost blocking, +0.03 s parry window | +5% damage, −20% stamina lost blocking, +0.06 s parry window | +12% damage, −35% stamina lost blocking, +0.10 s parry window |
| **Moonlight Flit** | Dodging | −0.3 s dodge recharge, −5% stamina costs | +4% attack speed, −0.6 s dodge recharge, −10% stamina costs | +8% attack speed, −1.0 s dodge recharge, −15% stamina costs |
| **Eviction** | All-out attack | +6% damage, +3% attack speed | +12% damage, +6% attack speed, 1% life steal | +20% damage, +10% attack speed, 2.5% life steal |
| **Squatter's Rights** | Tanking | +5% max HP, +3 defense (all) | +5% poise damage, +12% max HP, +7 defense (all) | +10% poise damage, +20% max HP, +12 defense (all) |
| **Fine Print** | Spellcasting | +4% cast speed, +6% spell power | +8% cast speed, +12% spell power, −5% spell cooldowns | +12% cast speed, +20% spell power, −12% spell cooldowns |
| **Late Fees** | Bleed, burn and other ailments | +15% status buildup | 1% life steal, +35% status buildup | +5% damage, 2% life steal, +60% status buildup |
| **Handyman** | Weapon skills | −6% skill cooldowns | −12% skill cooldowns, −5% stamina costs | +5% damage, −20% skill cooldowns, −10% stamina costs |
| **Demolition** | Heavy hits and staggers | +10% poise damage | +4% damage, +25% poise damage | +10% damage, +40% poise damage, +5% max HP |
| **Tea Break** | Healing and staying power | +8% stamina regen, Thermos heals +10% | +15% stamina regen, 1% life steal, Thermos heals +20% | +25% stamina regen, 2% life steal, Thermos heals +35% |

## 10. Gems

**No tiers (D284).** A gem has 1–3 perks of distinct families, all weapon perks or all armor perks. Weapon gems go in
weapons, staffs and talismans; armor gems in armour and shields (D227). Each perk has its own **level** (1–50) and
**quality roll** (−50% … +50%):

- **Strength** = the family's baseline × level multiplier × (1 + roll). Level 1 is ×0.25 of the baseline, level 50
  ×3, in even steps (about ×1 at level 14) (D197).
- **Rolls**: Green -50% … -15% (55%), Blue -15% … 10% (30%), Purple 10% … 35% (11%), Orange 35% … 50% (4%). Gems of level 25 and up roll quality twice and keep the best; treasure chests and
  bosses add a roll, Gary one or two (one more in NG+).
- **Drop level** rises evenly from 1 (zone 1) to 50 (the start of NG+3), up to 4 below that target.
- **Elemental families** (Ember, Rime, Storm, Dawn, Dusk) **add** their share of the hit as their own type on top of
  the physical (D283), at a baseline 20% above Brutal's (D292), with 22 status buildup × the roll.
- **Drops** (D281): 1.3% per enemy, 7.8% per chest, 65% per boss. The bonfire shop and Gary also sell gems (3× their
  sale price).
- **Fusing**: the original gem (2+ perks) keeps the chosen perks and takes the rest from a loose donor gem of the same
  kind, which is used up. It must keep at least one of its **original** perks, and after the fuse only the original
  perks it kept count as original: a,b,c + d,e,f keeping a,d,f must keep a in every later fuse (D286). Cost: the sale
  price of the best perk kept, at least 40 Glowen.
- **Gem bench**: picking an empty socket lists only the gems that fit it (D280); **Sell all gems** sells every loose
  gem that is not locked (D282). Unsocketing is free, anywhere (D168).
- **Sale price**: per perk 80 × level strength × (1 + roll), at least 5.

| Family | Kind | Baseline (level ≈14, +0% roll) | Effect | Colour |
|---|---|---|---|---|
| **Quicksilver** | weapon | 12 | +12% attack and cast speed | `#cfd6dc` |
| **Tempo** | weapon | 12 | −12% skill cooldowns | `#e6b84a` |
| **Fleetfoot** | weapon | 0.6 | −0.6 s dodge recharge | `#58d66a` |
| **Brutal** | weapon | 11 | +11% damage | `#d63a3a` |
| **Ember** | weapon | 13.2 | +13.2% of the hit as Fire, Burn buildup (added on top, D283) | `#ff7a1a` |
| **Rime** | weapon | 13.2 | +13.2% of the hit as Magic (frost), Chill buildup (added on top, D283) | `#9ad0ff` |
| **Storm** | weapon | 13.2 | +13.2% of the hit as Magic (lightning), Shock buildup (added on top, D283) | `#6f8dff` |
| **Dawn** | weapon | 13.2 | +13.2% of the hit as Holy (added on top, D283) | `#ffe98a` |
| **Dusk** | weapon | 13.2 | +13.2% of the hit as Void (added on top, D283) | `#8a8396` |
| **Leech** | weapon | 4 | 4% lifesteal | `#8a1020` |
| **Vigor** | weapon | 16 | −16% stamina costs | `#2aa198` |
| **Bulwark** | armor | 16 | +16 defense to all types | `#9a9aa6` |
| **Hearth** | armor | 8 | +8% max HP | `#e0705a` |
| **Zephyr** | armor | 16 | +16% stamina regeneration | `#a8e6cf` |
| **Gilt** | armor | 11 | +11% Glowen found | `#d4af37` |

## 11. Consumables (quick use, up to 10 of each)

| Item | Price | Effect |
|---|---|---|
| **Throwing Knife** | 15 | Thrown: 16 physical (scales with item level), Bleed 20. |
| **Firebomb** | 30 | Lobbed: circle(90) 60 Fire, Burn 50, fire puddle 3 s. |
| **Frost Jar** | 35 | Lobbed: circle(100) Freeze 1.5 s on non-bosses; Chill 60 on bosses. |
| **Holy Water** | 40 | You and allies within 120 px: clear all statuses; 40 Holy burst to undead and void. |
| **Stamina Tonic** | 25 | +60 stamina instantly, +50% stamina regen for 6 s. |
| **Lure** | 30 | Throws a decoy that taunts enemies within 300 px for 4 s (bosses 2 s). |
| **Shard Pouch** | drop only | Use: gain 150 × zone Shards. |

The Tear of Undoing (respec at a bonfire) is kept on the character, not in the quick-use cycle; bosses drop one 10%
of the time and spell reliquaries 5%. Glowen Wisps (a 1% drop) are taken on pickup. **Nothing restores a Thermos
charge except resting at a bonfire or dying (D150, D38).**

## 12. Loot

**Rarity weights by source** (percent):

| Source | Common | Uncommon | Rare | Epic | Legendary |
|---|---|---|---|---|---|
| fodder | 70 | 22 | 5 | 2.5 | 0.5 |
| brute | 70 | 22 | 5 | 2.5 | 0.5 |
| elite | 45 | 35 | 12.5 | 6 | 1.5 |
| chestSmall | 25 | 40 | 25 | 8 | 2 |
| chestTreasure | 20 | 35 | 30 | 11 | 4 |
| mimic | 0 | 20 | 45 | 27 | 8 |
| boss | 20 | 35 | 30 | 11 | 4 |
| shop | 0 | 40 | 45 | 15 | 0 |
| gary | 0 | 0 | 0 | 70 | 30 |

- **Item drop chance per kill** (D84): standard enemies 6% (a swarm piece 1.5%), Elites 15%; bosses drop 2–5 items per
  player.
- **Slot roll**: weapon 35, shield 15, staff 5, talisman 5, head 12, body 14, legs 10, ring 4.
- **Glowen** (D83): every kill has a 35% chance of a puff of (4 + 2 × zone) × the role's share (swarm 0.3, fodder 1,
  others 1.5, Elite 4).
- **Consumables**: 8% of chests give a bundle of 3–6 of one kind; fodder 3% a single knife or bomb.
- **Sell values**: gear Common 10, Uncommon 25, Rare 60, Epic 150, Legendary 400, × (1 + 0.3 (ilvl − 1)); gems as §10;
  consumables half price. Sell all returns socketed gems to your pouch; selling one item on its own sells its gems with
  it and asks first (D240).

## 13. Proficiency (D178, D215, D218)

Every kill gives experience to what you have out: the item in the weapon hand and a staff, talisman or shield in the
off hand (not while two-handing; an off-hand crossbow earns none, D294). It fills the item's own bar and its class's
proficiency (levels 1–100). Odd levels raise the first perk, even levels the second; perks work only while an item of
that class is out.

| Class | Perk on odd levels (per point) | Perk on even levels (per point) |
|---|---|---|
| Greataxes | Damage 1% | Poise damage 1% |
| Greathammers | Damage 1% | Poise damage 1.5% |
| Colossal Swords | Damage 1% | Swing stamina 0.6% |
| Hollow Mauls | Damage 1% | Poise damage 1.5% |
| Battleaxes | Damage 1% | Poise damage 1% |
| Twin Axes | Attack speed 0.5% | Lifesteal 0.06% |
| Clubs | Poise damage 1.5% | Swing stamina 0.8% |
| Maces | Poise damage 1.5% | Damage 0.8% |
| Censer Flails | Damage 0.8% | Reach 0.8% |
| Longswords | Damage 0.8% | Swing stamina 0.6% |
| Katanas | Damage 0.8% | Attack speed 0.5% |
| Spellblades | Damage 0.8% | Cast speed 0.6% |
| Rapiers | Attack speed 0.6% | Dodge recharge 0.02 s |
| Twin Daggers | Attack speed 0.6% | Bleed buildup 2% |
| Spears | Reach 0.8% | Damage 0.8% |
| Halberds | Reach 0.8% | Poise damage 1% |
| Dawn Glaives | Damage 0.8% | Reach 0.6% |
| Whips | Reach 1.2% | Attack speed 0.5% |
| Bows | Damage 1% | Skill cooldowns 0.8% |
| Crossbows | Damage 1% | Reload speed 0.6% |
| Staffs | Spell cooldowns 0.8% | Spell power 0.8% |
| Talismans | Spell cooldowns 0.8% | Cast speed 0.6% |
| Small Shields | Parry window 0.003 s | Block stamina 0.6% |
| Medium Shields | Block stamina 0.8% | Elemental block 0.3% |
| Great Shields | Block stamina 1.2% | Elemental block 0.4% |

**Raising a rarity**: a full item bar (Common 120, Uncommon 240, Rare 400, Epic 640 experience) lets you pay Glowen at
a bonfire to raise the item one rarity (Common → Uncommon 150, → Rare 400, → Epic 1,000, → Legendary 2,500, × (1 + 0.2
per ilvl above 1)).

## 14. Soul Essence and reinforcement (D198)

Soul Essence drops from zone 4 of the first playthrough (Tier 1), then one tier higher each New Game+ cycle (Tier 5 from
NG+4). It cannot be sold. At a bonfire it reinforces weapons, shields, casting tools and armour from +0 to +15; each
+1 is +20% (+15 is ×4).

| Tier | Name | Blurb |
|---|---|---|
| 1 | **Tenant’s Wisp** | Somebody who could not make rent. Went hollow paying it anyway. This bit stayed behind. |
| 2 | **Lodger’s Ember** | A soul that has been evicted once and came back down the stairs. Warmer for it. |
| 3 | **Caretaker’s Flame** | One of the Joes who lit the fires. Still tidying up after everyone. |
| 4 | **Superintendent’s Blaze** | Kept the whole building running for years. The Landlord sent three staff to collect it. None came back. |
| 5 | **Freeholder’s Soul** | Owned outright. No lease, no rent, no Landlord. It does not glow; everything near it does. |

| Step | Essence | Glowen | Item strength after |
|---|---|---|---|
| +0 → +1 | 1 × Tier 1 | 100 | ×1.2 |
| +1 → +2 | 2 × Tier 1 | 145 | ×1.4 |
| +2 → +3 | 3 × Tier 1 | 210 | ×1.6 |
| +3 → +4 | 1 × Tier 2 | 305 | ×1.8 |
| +4 → +5 | 2 × Tier 2 | 442 | ×2 |
| +5 → +6 | 3 × Tier 2 | 641 | ×2.2 |
| +6 → +7 | 1 × Tier 3 | 929 | ×2.4 |
| +7 → +8 | 2 × Tier 3 | 1348 | ×2.6 |
| +8 → +9 | 3 × Tier 3 | 1954 | ×2.8 |
| +9 → +10 | 1 × Tier 4 | 2833 | ×3 |
| +10 → +11 | 2 × Tier 4 | 4108 | ×3.2 |
| +11 → +12 | 3 × Tier 4 | 5957 | ×3.4 |
| +12 → +13 | 1 × Tier 5 | 8638 | ×3.6 |
| +13 → +14 | 2 × Tier 5 | 12525 | ×3.8 |
| +14 → +15 | 3 × Tier 5 | 18162 | ×4 |

When short of a tier, a reinforcement breaks higher tiers 3:1 by itself. The Reinforce tab's **Break down Essence**
panel also converts by hand: one Essence becomes three of the tier below, with **Convert 1** and **Convert all** for
each tier 2–5 (D285).
