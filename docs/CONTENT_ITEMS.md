# Dungeon Joe — Items: Weapons, Skills, Shields, Casting Tools, Armor, Rings, Affixes, Gems, Consumables, Loot

Source for `src/data/weapons.ts`, `skills.ts`, `shields.ts`, `castingTools.ts`, `armor.ts`, `rings.ts`,
`affixes.ts`, `legendaries.ts`, `gems.ts`, `consumables.ts`, `lootTables.ts`.
Mechanics in [GAME_DESIGN.md](GAME_DESIGN.md) §3, §5, §8. Tone: names plain, flavor lines dry.

## 1. Conventions

- **ilvl** (item level) 1–8 for the first playthrough, +1 per NG+ cycle (no cap; tables extrapolate).
- Weapon base damage: `base(ilvl) = base1 × (1 + 0.45 × (ilvl − 1))`.
- Armor defense: `def(ilvl) = def1 × (1 + 0.6 × (ilvl − 1))`.
- Requirements: `req(ilvl) = req1 + 2 × (ilvl − 1)` on the primary stat only (secondary stays).
- Speed class sets the combo timings and the **revive value** (GAME_DESIGN §12).
- Every weapon class has exactly 3 skills, unlocked in order by tier (GAME_DESIGN §8.3) on Q / E / R.
- Skills cost stamina and have a cooldown; damage is `× weaponDamage` unless noted. Cooldowns are
  reduced by Tempo gems and cooldown affixes (cap 50% total).
- `arc(θ, r)` is a melee arc centered on the aim; `thrust(w, l)` a rectangle; `proj(speed)` a projectile.

## 2. Item level tiers

| ilvl | Tier | Skills | Zone (cycle 0) |
|---|---|---|---|
| 1–2 | Worn | 0 | 1–2 |
| 3–4 | Fine | 1 | 3–4 |
| 5–6 | Masterwork | 2 | 5–6 |
| 7+ | Mythic | 3 | 7–8, NG+ |

Legendary rarity: +1 skill (cap 3). Shops and Gary sell at the zone's ilvl (Gary +1).

## 3. Rarity and drop tables

Weights by source (Common / Uncommon / Rare / Epic / Legendary):

| Source | C | U | R | E | L |
|---|---|---|---|---|---|
| Fodder, swarm, ranged, caster, hazard | 60 | 27 | 9 | 3.2 | 0.8 |
| Brute, tank, assassin | 45 | 32 | 15 | 6 | 2 |
| Elite (guaranteed drop) | 0 | 30 | 45 | 20 | 5 |
| Chest (small, after a room) | 25 | 40 | 25 | 8 | 2 |
| Chest (treasure room) | 0 | 35 | 40 | 20 | 5 |
| Mimic (chest roll + bonus) | 0 | 20 | 45 | 27 | 8 |
| Boss (two rolls: 100% and 50%) | 0 | 0 | 50 | 38 | 12 |
| The Instructor | 0 | 0 | 0 | 0 | 100 (weapon, 3 skills) or a spell |
| Bonfire shop rotating piece | 0 | 40 | 45 | 15 | 0 |
| Gary | 0 | 0 | 0 | 70 | 30 |

Drop chance per kill: fodder 18%, swarm piece 4%, others 30%, elite 100%, boss 100% (+50% second).
Item **slot** roll: weapon 35%, off-hand (shield 15%, staff 5%, talisman 5%) 25%, head 12%, body 14%,
legs 10%, ring 4%. Affix count, sockets: GAME_DESIGN §8.2. Gems: GAME_DESIGN §8.5.

Legendary items carry one **legendary power** (§9) in addition to 3 affixes.

## 4. Weapon classes

Timings in ms (windup / active / recovery), at base attack speed. Stamina per swing. Poise damage per hit.
`Dmg` = base1 at ilvl 1 (physical unless noted). Grades: Bonk / Slicey. **Grades are spread on purpose**
(D40): main-stat scaling runs from E to S; some weapons have no second stat at all, some a little (D),
and the true hybrids split it (Halberd A/C, Longsword B/B). Weapons with poor scaling carry a higher
base so they stay useful early and fall off late; weapons with S scaling start weak and end strongest.

| Class | Grades (B/S) | Req (Bonk/Slicey) | Speed class | Combo | Dmg | Stam | Poise dmg | Hitbox | Revive value | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **Greathammer** | S / – | 14 / 0 | Very slow | 2: 550/150/500 ×1.0, 650/150/600 ×1.3 | 62 | 28 | 60 | arc(100°, 120), overhead thrust(70, 140) | 4.0 | Hyper armor. "For when the problem is a wall." |
| **Greataxe** | A / – | 12 / 0 | Slow | 3: 450/140/400 ×1.0, ×1.0, 600/160/550 ×1.4 | 54 | 24 | 50 | arc(130°, 115) | 3.5 | Hyper armor on hit 3. Pure Bonk. |
| **Colossal Sword** | A / E | 13 / 8 | Slow | 3: 480/150/420 ×1.0, ×1.1, 620/160/560 ×1.5 | 56 | 25 | 50 | arc(150°, 130) | 3.5 | Widest arc. Hyper armor. |
| **Crossbow** | B / – | 10 / 0 | Slow (ranged) | 1: 120/–/700 ×1.4 | 40 | 14 | 25 | proj(620) bolt | 1.5 | Reload is the recovery. Bolts pierce 1 target with Bonk ≥ 30. |
| **Club** | E / – | 8 / 0 | Medium-slow | 2: 380/120/360 ×1.0, 450/130/420 ×1.2 | 46 | 18 | 40 | arc(110°, 95) | 3.0 | Nobody's weapon. High base, barely scales. "Wood. It doesn't care how strong you are." |
| **Twin Daggers** | – / S | 0 / 14 | Very fast | 4: 150/80/150 ×0.5 each, 4th ×0.7 | 26 | 8 | 8 | arc(80°, 70) | 0.8 | Bleed 15 per hit. Backstab ×1.5 from behind. |
| **Rapier** | – / A | 0 / 10 | Fast | 3: 200/90/200 ×0.8, ×0.8, 300/100/320 ×1.2 | 30 | 11 | 12 | thrust(28, 120) | 1.2 | Reach. Crit ×1.5 on riposte-staggered. Pure Slicey. |
| **Katana** | D / A | 7 / 12 | Fast | 3: 230/100/220 ×0.9, ×0.9, 330/110/340 ×1.3 | 34 | 12 | 15 | arc(120°, 110) | 1.5 | Bleed 20 per hit. |
| **Bow** | – / B | 0 / 10 | Fast (ranged) | 1: 200/–/260 ×1.0; hold ≥ 0.6 s: ×1.8 charged | 28 | 10 | 10 | proj(700) arrow | 0.6 | Charged shots pierce 1 target. |
| **Whip** | – / E | 0 / 9 | Medium | 2: 280/120/300 ×0.9, 340/140/360 ×1.1 | 40 | 12 | 10 | thrust(26, 220) | 1.0 | Longest melee reach. Cannot be blocked by enemy front guards (goes over). High base, barely scales. |
| **Longsword** | B / B | 9 / 9 | Medium | 3: 300/110/280 ×1.0, ×1.0, 400/120/380 ×1.3 | 38 | 15 | 25 | arc(110°, 105) | 2.0 | The true hybrid. "A sword. Long." |
| **Spear** | C / B | 8 / 10 | Medium | 3: 260/100/260 ×0.9 thrust, ×0.9, 380/120/360 ×1.3 | 38 | 14 | 20 | thrust(30, 150) | 2.0 | Can attack while two-hand guarding with *Phalanx*. |
| **Battleaxe** | A / D | 11 / 7 | Medium-slow | 3: 340/120/320 ×1.0, ×1.1, 450/140/430 ×1.4 | 44 | 18 | 35 | arc(120°, 100) | 2.5 | Bonk with a little Slicey. |
| **Mace** | B / E | 11 / 3 (tuned, D55) | Medium-slow | 2: 360/120/340 ×1.1, 460/140/440 ×1.4 | 46 | 18 | 45 | arc(100°, 95) | 3.0 | 20% of damage is Holy. |
| **Halberd** | A / C | 10 / 10 | Medium-slow | 3: 340/130/340 ×1.0 sweep, ×1.0 thrust, 480/150/460 ×1.4 | 44 | 17 | 30 | arc(140°, 135) / thrust(30, 160) | 2.5 | The great hybrid: mostly Bonk, real Slicey. |
| **Twin Axes** | C / B | 10 / 10 | Fast | 3: 220/100/210 ×0.8, ×0.8, 320/110/320 ×1.2 | 34 | 12 | 18 | arc(100°, 90) | 1.5 | Berserker's weapon. |

### 4.1 Skills (3 per class, in unlock order Q → E → R)

| Class | Q (unlock 1) | E (unlock 2) | R (unlock 3) |
|---|---|---|---|
| Greathammer | **Earthshaker** cd 10, 30 stam: slam circle(140) ×2.2, knockback 160, guaranteed stagger. | **Meteor Lunge** cd 14, 35: leap to the cursor (≤ 300 px, 0.5 s airborne with i-frames that *do* work on Red but not Piercing), land circle(120) ×2.5. | **Unstoppable** cd 24, 20: 6 s hyper armor on all actions, +20% damage, −30% damage taken. |
| Greataxe | **Cleave Spin** cd 9, 26: 360° ×1.6. | **Execute** cd 15, 30: thrust(60, 150) ×1.5; ×3.5 on enemies below 25% HP; kills refund half the cooldown. | **Bloodlust** cd 22, 15: for 8 s, each kill grants +10% damage (max 5 stacks) and 3% HP. |
| Colossal Sword | **Guillotine** cd 12, 32: overhead thrust(80, 220) ×2.6, poise dmg 120. | **Stomp** cd 10, 20: ring(0, 170) ×0.8, staggers everything non-boss, interrupts windups. | **Charged Swing** cd 16, 40: hold up to 1.5 s, release arc(140°, 200) ×1.5 → ×4.0 with charge; hyper armor while charging. |
| Crossbow | **Piercing Bolt** cd 8, 18: line(24, 800) through all enemies ×2.0. | **Explosive Bolt** cd 12, 22: proj → circle(100) ×1.8 Fire, Burn 40. | **Rapid Fire** cd 18, 30: 5 bolts in 1.2 s ×1.0 each, no reload. |
| Club | **Bonk** cd 8, 22: overhead ×2.0, guaranteed stagger (bosses: 2× poise dmg). | **Wild Swing** cd 11, 26: arc(270°, 110) ×1.3. | **Tantrum** cd 20, 15: +30% attack speed and +20% poise dmg for 6 s. |
| Twin Daggers | **Shadow Step** cd 9, 14: dash 200 px through the aim, hitting ×1.2 on entry and ×1.2 on exit; ends behind the target (backstab ready). | **Fan of Knives** cd 10, 16: 6 proj(600) in a 60° fan ×0.7, Bleed 15 each. | **Flurry** cd 16, 24: 8 hits in 1.2 s ×0.6, locked in place, hyper armor. |
| Rapier | **Lunge** cd 7, 16: dash-thrust(30, 260) ×1.8. | **Riposte Stance** cd 14, 12: 1.0 s stance; any non-Red hit received is parried and auto-riposted ×3 (works without a shield). | **Thousand Cuts** cd 18, 26: 5 thrusts in 0.9 s ×1.0, each applies Bleed 20. |
| Katana | **Iai Slash** cd 10, 20: 0.5 s sheath (hyper armor) then thrust(60, 260) ×2.4. | **Crescent** cd 9, 18: proj(500) wave arc ×1.3 through enemies. | **Blood Moon** cd 20, 15: 8 s: Bleed buildup ×2 and Bleed bursts deal +50%. |
| Bow | **Volley** cd 10, 18: randomCircles(5, 60) around the cursor ×1.2 after 0.8 s. | **Piercing Shot** cd 8, 16: line(20, 900) ×2.0. | **Rain** cd 20, 30: 12 arrows over 3 s on circle(180) at the cursor ×0.8 each. |
| Whip | **Lash** cd 7, 14: thrust(30, 260) ×1.6, pulls non-boss enemies to you. | **Crack** cd 10, 18: cone(60°, 250) ×1.2, staggers, Shock 30. | **Serpent Coil** cd 16, 24: 3 s spin, arc(360°, 180) ×0.5 every 0.4 s, you can move at 60%. |
| Longsword | **Shield Breaker** cd 8, 18: thrust(40, 160) ×1.8, ignores enemy front guards, +100 poise dmg. | **Spin Slash** cd 11, 22: 360° ×1.4. | **Battle Cry** cd 20, 10: party +15% damage and +20 poise for 8 s. |
| Spear | **Impale** cd 8, 18: thrust(30, 220) ×2.0, roots non-boss 1 s. | **Sweep** cd 10, 20: arc(300°, 150) ×1.2, knockback 120. | **Phalanx** cd 18, 10: 4 s: two-hand guard becomes 80% physical / 40% elemental, and you can thrust while guarding. |
| Battleaxe | **Cleave** cd 8, 20: arc(140°, 130) ×1.8. | **Hook** cd 12, 18: thrust(40, 180) ×1.2, pulls, Bleed 30. | **Frenzy** cd 20, 15: +25% attack and move speed 6 s. |
| Mace | **Holy Smite** cd 9, 22: circle(90) ×2.0 Holy. | **Consecrate** cd 15, 20: circle(160) for 6 s: party inside +20% Holy damage and heals 2%/s; undead inside take ×0.3 per second. | **Judgment** cd 20, 30: overhead ×1.6; ×3.0 against staggered or riposte-staggered enemies. |
| Halberd | **Moulinet** cd 9, 24: two 360° sweeps ×1.3 each over 1 s. | **Hook Pull** cd 12, 18: thrust(40, 200) ×1.2, pulls. | **Vault** cd 12, 20: leap 260 px over enemies (i-frames vs Red, not Piercing), land thrust(60, 120) ×1.5. |
| Twin Axes | **Whirlwind** cd 12, 26: 2 s spin, arc(360°, 110) ×0.6 every 0.3 s, moving at 80%. | **Throw** cd 8, 14: 2 proj(560) axes ×1.2 that return (hit twice). | **Rampage** cd 22, 10: 10 s: kills reset Throw and grant +5% attack speed (max 5). |

## 5. Shields (off-hand)

| Shield | Type | Req Bonk / Slicey | Physical block | Elemental block | Stability (stam per 100 blocked) | Parry window | Notes |
|---|---|---|---|---|---|---|---|
| Buckler | Small | 0 / 8 | 60% | 20% | 45 | 0.18 s | Best parry. |
| Targe | Small | 6 / 6 | 70% | 30% | 40 | 0.16 s | — |
| Round Shield | Medium | 8 / 0 | 80% | 35% | 30 | 0.12 s | — |
| Kite Shield | Medium | 10 / 0 | 88% | 45% | 28 | 0.12 s | Knight's. |
| Heater Shield | Medium | 12 / 0 | 90% | 50% | 26 | 0.10 s | — |
| Tower Greatshield | Great | 18 / 0 | 100% | 55% | 18 | — | Walk speed −10% while raised. |
| Spiked Greatshield | Great | 20 / 0 | 100% | 65% | 20 | — | Blocking a melee hit deals ×0.5 back. |
| Holy Bulwark (Legendary only) | Great | 22 / 0 | 100% | 80% Holy/Void, 60% other | 16 | — | Blocking heals 1%. Appears only when a Legendary shield rolls at ilvl ≥ 5 (25% of such rolls). |

Block values improve +1% physical / +1.5% elemental per ilvl above 1 (caps 100% / 85%).

## 6. Casting tools (off-hand)

`toolMult = grade × (1 + 0.35 × (ilvl − 1))`. Cast speed modifies spell cast times (cap ×1.6).

| Tool | School | Req | Grade | Cast speed | Notes |
|---|---|---|---|---|---|
| Apprentice Staff | Brain | 8 | C 0.9 | 1.0 | Scholar's start. |
| Arcane Staff | Brain | 14 | B 1.0 | 1.0 | — |
| Void Staff | Brain | 12 | B 1.0 | 1.0 | Void spells +20%; Occultist's start. |
| Storm Staff | Brain | 16 | B 1.0 | 1.1 | Lightning spells +20%. |
| Archmagister's Rod | Brain | 24 | S 1.25 | 1.15 | — |
| Wooden Talisman | Prayer | 8 | C 0.9 | 1.0 | Cleric's start. |
| Silver Talisman | Prayer | 14 | B 1.0 | 1.0 | — |
| Sunlight Talisman | Prayer | 20 | A 1.1 | 1.05 | Holy damage +20%. |
| Saint's Relic | Prayer | 26 | S 1.25 | 1.15 | Heals +15%. |

## 7. Armor

Three slots: Head, Body, Legs. Weight class changes nothing but the defense split (D35, no equip load).
The table gives the **per-piece base** at ilvl 1; a piece's defense = base × slot multiplier (Head 0.8,
Body 1.4, Legs 0.8) × `(1 + 0.6 (ilvl − 1))`. A full heavy set at ilvl 1 therefore has 33 physical
(8.8 + 15.4 + 8.8) and 172 at ilvl 8 (63% reduction via `100 / (100 + Def)`).

| Weight | Physical | Fire / Frost / Lightning | Holy / Void |
|---|---|---|---|
| Light (cloth, leather) | 4 | 7 | 6 |
| Medium (chain, brigandine) | 7 | 5 | 4 |
| Heavy (plate) | 11 | 3 | 2 |

Armor sets are named per zone and weight (24 sets, names in `armor.ts`): e.g. Crypt Rags (light, z1),
Sexton's Mail (medium, z1), Caretaker's Plate (heavy, z1) … Lessee's Suit (light, z8), Abyssal Scale
(medium, z8), Foreclosure Plate (heavy, z8). Armor rolls affixes and 0–1 socket (armor gems only).

## 8. Rings (2 slots)

Rings have no ilvl scaling except where noted; they roll a rarity (affects which rings can appear).

| Ring | Rarity floor | Effect |
|---|---|---|
| Lucky Charm | Uncommon | +10% Shard find (Gary sells it). |
| Thermos Lid | Rare | Flask heals +15%. |
| Band of Bonk / Slicey / Brain / Prayer / Vigor / Health | Rare | +3 to that stat (+5 at Epic, +8 at Legendary). |
| Fleet Ring | Rare | −0.5 s dodge recharge. |
| Ring of Stillness | Epic | Standing still 1 s grants +15% damage. |
| Chloranthy Knot | Epic | +20% stamina regen. |
| Glowcatcher | Epic | +25% gem drop chance, +20% Glowen. |
| Red Thread | Legendary | Blocking is impossible; Red attacks deal −25% to you. |
| Ghost Lantern | Legendary | Your hits on ghosts count double for reviving. |
| Slumlord's Signet | Legendary | +15% damage, −15% max HP. |

## 9. Legendary powers (one per Legendary item)

Weapons and armor roll one power from their rows. Legendary **shields** and **casting tools** roll from
their own rows below. Legendary **rings** are the named rings in §8 with a Legendary floor (no extra
power).

| Power | On | Effect |
|---|---|---|
| Mirror Face | shield | Parried projectiles return with ×2 damage. |
| Warden | shield | Each blocked hit heals allies within 120 px by 1% of their max HP. |
| Unyielding | shield | Stability costs −40%; cannot be guard-broken by hits under 10% of your max HP. |
| Echo | staff / talisman | 10% chance a cast repeats itself for free 0.4 s later. |
| Font | staff / talisman | Spells cost no stamina while you are above 80% HP. |
| Litany | talisman | Your heals also restore 10% stamina to their targets. |
| Overcharge | staff | Spells deal +25% but you take +10% damage. |
| Thunderclap | weapon | Every 4th hit chains Lightning to 3 enemies ×0.8. |
| Sunder | weapon | Skills ignore 30% of enemy defense. |
| Second Wind | weapon | A kill refunds 20 stamina. |
| Hungering | weapon | +4% lifesteal, −10% max HP. |
| Momentum | weapon | Each consecutive hit without being hit +3% damage (max 10). |
| Riposte Master | weapon | Ripostes deal ×4 and heal 5%. |
| Spellsword | weapon | Spells cast within 2 s after a light attack cost no stamina. |
| Timekeeper | weapon | Dodge recharge −1 s (floor 3 s). |
| Mimic's Tooth | weapon | Chests have a 0% mimic chance; mimics you attack first take ×2. |
| Moss Mantle | armor | Statuses build 40% slower. |
| Hollow Guard | armor | Below 30% HP: −30% damage taken. |
| Coward's Comfort | armor | Dodging grants 1 s of +40% move speed. |
| Joe's Lucky Socks | legs | +1 flask charge (not above 5). |

## 10. Affixes

Rolled per rarity (count in GAME_DESIGN §8.2), no duplicates on one item. Ranges scale by ilvl (`lo..hi`
at ilvl 1, ×(1 + 0.2 (ilvl − 1)) for flat values; percents fixed).

| Affix (prefix/suffix name) | Slots | Range |
|---|---|---|
| Brutal (+% damage) | weapon | 4–12% |
| Heavy (+flat physical) | weapon | 3–10 |
| Burning / Freezing / Shocking / Radiant / Dusky (+flat element and +status buildup) | weapon | 4–12 + 10–25 buildup |
| Swift (+attack speed) | weapon | 4–10% |
| Hasty (−skill cooldowns) | weapon, ring | 4–12% |
| Fleet (−dodge recharge) | legs, ring | 0.3–0.6 s |
| Frugal (−stamina costs) | weapon, body | 5–12% |
| Leeching (lifesteal) | weapon | 1–3% |
| Crushing (+poise damage) | weapon | 10–30% |
| Warded (+defense all) | armor | 3–9 |
| Fireproof / Frostproof / Insulated / Hallowed / Voidtouched (+40% defense of one type) | armor | fixed |
| Hearty (+max HP) | armor | 15–45 |
| Enduring (+max stamina) | armor | 6–18 |
| Lucky (+Shard find) | ring, head | 5–15% |
| Glowing (+Glowen find) | ring, head | 10–30% |
| Of the Medic (+revive value per hit) | weapon | +0.5–1.5 |
| Of the Bonker / Slicer / Thinker / Pious / Vigorous / Hale (+stat) | any | +1–3 |
| Steadfast (+stability) | shield | 10–25% less stamina per block |
| Reflective (+elemental block) | shield | +10–20% |

## 11. Gems

Defined in GAME_DESIGN §8.5. A gem has 1–3 perks, each with its own tier T1–T5. Drop sources and Glowen
economy there. Gem names in the inventory list the perks: "Quicksilver (T3) + Leech (T1)" with a "Weapon gem"
or "Armor gem" chip and a cut-gem icon split into one facet per perk colour (Quicksilver silver, Tempo gold,
Fleetfoot green, Brutal red, Ember orange, Rime ice blue, Storm blue, Dawn pale yellow, Dusk grey-violet, Leech
dark red, Vigor teal; armor: Bulwark grey, Hearth coral, Zephyr mint, Gilt gold).

## 12. Consumables (quick-use, max 10 each)

| Item | Effect | Bonfire price (Glowen) |
|---|---|---|
| Throwing Knife | proj(650) ×0.8 of a base 20 physical (scaled by ilvl), Bleed 20. | 15 |
| Firebomb | lobbed, circle(90) 60 Fire (ilvl-scaled), Burn 50, puddle 3 s. | 30 |
| Frost Jar | lobbed, circle(100): **Freeze** 1.5 s on non-bosses, Chill 60 buildup on bosses. | 35 |
| Holy Water | self + 120 px allies: clear statuses, Holy burst 40 to undead/void. | 40 |
| Stamina Tonic | +60 stamina instantly, +50% regen 6 s. | 25 |
| Lure | throws a decoy that taunts enemies within 300 px for 4 s (bosses 2 s). | 30 |
| Shard Pouch | drop-only: 150 × zone Shards when used from the quick-use slot. | — |
| Glowen Wisp | drop-only: 60 × zone Glowen, consumed automatically on pickup. | — |
| Tear of Undoing | respec at a bonfire (stored on the character, not in the quick-use cycle). Gary: 2000 × zone. | — |

Nothing in the game restores a Thermos charge except dying or the first rest at a bonfire
(GAME_DESIGN §9.2); no consumable, shop entry or effect may do so.

Consumables as drops: 8% of chests give a bundle (3–6 of one kind); fodder 3% one knife/bomb.

## 13. Sell values (Glowen)

Gear: Common 10, Uncommon 25, Rare 60, Epic 150, Legendary 400, each × (1 + 0.3 (ilvl − 1)).
Gems: the sum over their perks of 40 × 3^(tier−1). Consumables sell for half price. Spells cannot be sold.

## 14. Naming

Generated names: `<Affix prefix> <Base name> <Affix suffix>` for Uncommon–Epic (e.g. "Swift Longsword of
the Medic"); Legendaries have fixed proper names (one list per class, e.g. Greathammer: "Landlord's
Gavel", "Noise Complaint", "The Big One"); Commons are just the base name. Each base and each legendary
has a one-line dry flavor text (`flavor.ts`).
