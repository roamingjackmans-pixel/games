# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **One-shots** (severity 6): NG+2 zone 8: The Landlord's biggest hit (Supernova, pierce, 5,227 void) kills the Slicey: twin daggers build (871 HP) in one hit (1). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
2. **One-shots** (severity 6): NG+2 zone 8: The Landlord's biggest hit (Supernova, pierce, 5,227 void) kills the Bow (Slicey) build (868 HP) in one hit (0.99). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
3. **One-shots** (severity 6): NG+2 zone 8: The Landlord's biggest hit (Supernova, pierce, 5,227 void) kills the Brain caster: staff spells build (868 HP) in one hit (0.99). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
4. **Gems** (severity 4.6): Quicksilver raises sustained DPS by +3% (burst +7%) where Brutal gives +6% (0.41× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
5. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
6. **Enemy curve** (severity 3.8): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 108. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
7. **Spells** (severity 3.5): Arcane Beam (brain): 16.4 damage per busy second at Spell Skill 100, 2.05× the brain median (8). *Suggested:* Lengthen its cooldown or lower its base.
8. **Enemy curve** (severity 3.2): NG+2: zone 7 room enemies have 5,556 HP on average, below zone 6's 6,232. *Suggested:* Check the zone roster mix and the HP curve.
9. **Enemy curve** (severity 3.1): NG+1: zone 7 room enemies have 2,329 HP on average, below zone 6's 2,585. *Suggested:* Check the zone roster mix and the HP curve.
10. **Enemy curve** (severity 3): NG+2: zone 2 room enemies have 4,141 HP on average, below zone 1's 4,575. *Suggested:* Check the zone roster mix and the HP curve.
11. **Gear power** (severity 3): Reinforcement reaches ×3.25 at +15, while the whole rarity ladder is ×1.28: a +15 common out-hits a +0 legendary 2.5×, so drops matter little once reinforcement starts. *Suggested:* Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.
12. **Boss curve** (severity 2.9): NG+2: Mother Spore (zone 2) averages 999 a hit, below zone 1's boss (1,116). *Suggested:* Raise its phase damage multipliers.

(2 more findings of the same kinds are in the tables below.)

## 1. Enemies and bosses by zone

Room enemies: each roster enemy spawned with the real spawn code (solo); a hit is `attackDamage` for each attack with a damage multiplier. Bosses: every phase walked with the real phase code; the phase bar is the HP that phase has to lose.

### First playthrough

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 90 | 18–180 | 26 | 8–48 |  |
| 2 | 122 | 28–279 | 29 | 5–70 |  |
| 3 | 166 | 38–378 | 43 | 8–136 |  |
| 4 | 217 | 46–571 | 57 | 11–162 |  |
| 5 | 253 | 53–579 | 72 | 18–152 |  |
| 6 | 354 | 61–856 | 91 | 15–228 |  |
| 7 | 351 | 70–877 | 108 | 30–318 |  |
| 8 | 510 | 79–1,187 | 100 | 19–386 | ⚠ hits softer than zone 7 |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 36 (70) | 51 (109) | 59 (147) | 88 (178) | 98 (208) | 124 (238) | 156 (273) | 97 (308) |
| brute | 39 (180) | 54 (279) | 97 (378) | 131 (457) | 114 (535) | 198 (856) | 262 (701) | 239 (1,187) |
| caster | 28 (55) | 24 (85) | 35 (116) | 57 (140) | 53 (163) | 73 (187) | 92 (214) | 61 (242) |
| fodder | 22 (60) | 23 (102) | 27 (113) | 42 (152) | 56 (196) | 65 (245) | 83 (281) | 75 (343) |
| hazard | 21 (80) | 22 (124) | 48 (218) | 36 (203) | 63 (285) | 89 (272) | 84 (312) | 110 (703) |
| ranged | 18 (50) | 19 (78) | 41 (105) | 43 (127) | 52 (149) | 57 (170) | 84 (292) | 62 (220) |
| support | 17 (55) | 21 (85) | — | 42 (140) | 100 (163) | 61 (187) | 69 (214) | 80 (242) |
| swarm | 8 (18) | 8 (28) | 10 (38) | 15 (46) | 20 (53) | 18 (61) | 35 (70) | 28 (79) |
| tank | 33 (150) | 44 (233) | 57 (315) | 74 (571) | 105 (579) | 113 (663) | 131 (877) | 126 (890) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 2 | 1,260 / 1,260 | 2,520 | 69 / 72 | 118 |  |
| 2 | Mother Spore | 2 | 2,790 / 2,790 | 5,580 | 59 / 90 | 152 |  |
| 3 | The Bloatking | 2 | 3,780 / 3,780 | 7,560 | 86 / 111 | 153 |  |
| 4 | Vexthorn, the Hollow Stag | 2 | 5,257 / 5,257 | 10,514 | 119 / 167 | 241 |  |
| 5 | Foreman Ignatius | 2 | 6,417 / 10,697 | 17,114 | 152 / 220 | 388 |  |
| 6 | Saint Aurelia the Unthawed | 2 | 4,710 / 14,131 | 18,841 | 160 / 243 | 391 |  |
| 7 | Archmagister Tock | 2 | 12,626 / 8,417 | 21,043 | 256 / 388 | 508 |  |
| 8 | The Landlord | 4 | 13,450 / 13,054 / 13,053 / 15,665 | 55,222 | 320 / 408 / 601 / 509 | 908 |  |

### NG+1

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 1,837 | 368–3,681 | 131 | 41–243 |  |
| 2 | 1,669 | 380–3,802 | 230 | 43–560 | ⚠ HP below zone 1 |
| 3 | 1,723 | 393–3,926 | 239 | 45–748 |  |
| 4 | 1,940 | 409–5,118 | 269 | 51–765 |  |
| 5 | 2,026 | 428–4,642 | 287 | 71–607 |  |
| 6 | 2,585 | 447–6,251 | 308 | 51–770 |  |
| 7 | 2,329 | 465–5,810 | 334 | 93–987 | ⚠ HP below zone 6 |
| 8 | 3,084 | 478–7,173 | 362 | 70–1,398 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 185 (1,432) | 407 (1,478) | 323 (1,527) | 416 (1,592) | 391 (1,666) | 419 (1,737) | 485 (1,807) | 349 (1,860) |
| brute | 196 (3,681) | 431 (3,802) | 536 (3,926) | 616 (4,095) | 456 (4,285) | 670 (6,251) | 814 (4,648) | 865 (7,173) |
| caster | 139 (1,125) | 190 (1,162) | 190 (1,200) | 269 (1,251) | 210 (1,309) | 247 (1,364) | 286 (1,420) | 220 (1,461) |
| fodder | 110 (1,227) | 184 (1,394) | 147 (1,178) | 196 (1,365) | 223 (1,571) | 221 (1,786) | 257 (1,859) | 270 (2,072) |
| hazard | 107 (1,636) | 172 (1,690) | 262 (2,269) | 170 (1,820) | 254 (2,285) | 299 (1,985) | 260 (2,066) | 399 (4,250) |
| ranged | 91 (1,023) | 151 (1,056) | 224 (1,091) | 202 (1,137) | 210 (1,190) | 192 (1,240) | 260 (1,937) | 225 (1,328) |
| support | 84 (1,125) | 166 (1,162) | — | 199 (1,251) | 400 (1,309) | 206 (1,364) | 214 (1,420) | 288 (1,461) |
| swarm | 41 (368) | 65 (380) | 52 (393) | 72 (409) | 79 (428) | 60 (447) | 107 (465) | 100 (478) |
| tank | 165 (3,068) | 350 (3,168) | 316 (3,272) | 350 (5,118) | 421 (4,642) | 382 (4,837) | 405 (5,810) | 454 (5,380) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 28,714 / 43,071 / 43,071 | 114,856 | 351 / 367 / 422 | 689 |  |
| 2 | Mother Spore | 3 | 36,306 / 54,459 / 54,459 | 145,225 | 236 / 358 / 412 | 697 |  |
| 3 | The Bloatking | 3 | 44,958 / 67,437 / 67,437 | 179,832 | 289 / 372 / 428 | 590 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 50,149 / 75,223 / 75,223 | 200,595 | 353 / 495 / 569 | 821 |  |
| 5 | Foreman Ignatius | 3 | 84,327 / 70,273 / 70,273 | 224,873 | 404 / 585 / 673 | 1,189 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 30,945 / 108,307 / 108,307 | 247,558 | 395 / 600 / 690 | 1,110 |  |
| 7 | Archmagister Tock | 3 | 79,895 / 93,210 / 93,210 | 266,316 | 593 / 898 / 1,032 | 1,354 |  |
| 8 | The Landlord | 4 | 109,742 / 106,515 / 106,514 / 127,818 | 450,589 | 702 / 893 / 1,317 / 1,116 | 1,991 |  |

### NG+2

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 4,575 | 917–9,170 | 382 | 118–709 |  |
| 2 | 4,141 | 944–9,436 | 660 | 124–1,607 | ⚠ HP below zone 1 |
| 3 | 4,261 | 971–9,708 | 679 | 127–2,125 |  |
| 4 | 4,765 | 1,005–12,568 | 744 | 141–2,120 |  |
| 5 | 4,917 | 1,040–11,267 | 790 | 195–1,672 |  |
| 6 | 6,232 | 1,077–15,071 | 829 | 138–2,073 |  |
| 7 | 5,556 | 1,109–13,859 | 893 | 250–2,634 | ⚠ HP below zone 6 |
| 8 | 7,386 | 1,145–17,176 | 951 | 183–3,669 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 538 (3,566) | 1,168 (3,670) | 917 (3,775) | 1,154 (3,910) | 1,078 (4,045) | 1,129 (4,186) | 1,294 (4,312) | 917 (4,453) |
| brute | 571 (9,170) | 1,236 (9,436) | 1,523 (9,708) | 1,708 (10,055) | 1,257 (10,400) | 1,804 (15,071) | 2,172 (11,087) | 2,271 (17,176) |
| caster | 406 (2,802) | 544 (2,883) | 541 (2,966) | 745 (3,072) | 580 (3,178) | 665 (3,289) | 763 (3,388) | 577 (3,499) |
| fodder | 319 (3,057) | 528 (3,460) | 418 (2,912) | 543 (3,352) | 616 (3,813) | 596 (4,306) | 686 (4,435) | 708 (4,962) |
| hazard | 310 (4,075) | 494 (4,194) | 744 (5,609) | 471 (4,469) | 699 (5,547) | 806 (4,785) | 693 (4,928) | 1,048 (10,178) |
| ranged | 266 (2,547) | 433 (2,621) | 637 (2,697) | 559 (2,793) | 578 (2,889) | 518 (2,990) | 693 (4,620) | 590 (3,181) |
| support | 244 (2,802) | 476 (2,883) | — | 551 (3,072) | 1,104 (3,178) | 554 (3,289) | 572 (3,388) | 757 (3,499) |
| swarm | 118 (917) | 185 (944) | 149 (971) | 200 (1,005) | 219 (1,040) | 161 (1,077) | 287 (1,109) | 262 (1,145) |
| tank | 480 (7,641) | 1,004 (7,863) | 898 (8,090) | 970 (12,568) | 1,159 (11,267) | 1,029 (11,662) | 1,081 (13,859) | 1,192 (12,882) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 129,291 / 193,937 / 193,937 | 517,164 | 1,024 / 1,068 / 1,228 | 2,007 |  |
| 2 | Mother Spore | 3 | 146,260 / 219,391 / 219,391 | 585,042 | 678 / 1,029 / 1,183 | 1,999 | ⚠ hits softer than zone 1's boss |
| 3 | The Bloatking | 3 | 165,519 / 248,279 / 248,279 | 662,077 | 820 / 1,057 / 1,215 | 1,676 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 175,758 / 263,637 / 263,637 | 703,031 | 979 / 1,372 / 1,577 | 2,276 |  |
| 5 | Foreman Ignatius | 3 | 278,310 / 231,926 / 231,926 | 742,163 | 1,113 / 1,612 / 1,854 | 3,278 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 97,813 / 342,344 / 342,344 | 782,501 | 1,064 / 1,616 / 1,858 | 2,991 |  |
| 7 | Archmagister Tock | 3 | 247,462 / 288,706 / 288,706 | 824,875 | 1,583 / 2,397 / 2,756 | 3,614 |  |
| 8 | The Landlord | 4 | 291,989 / 283,401 / 283,400 / 340,081 | 1,198,870 | 1,843 / 2,345 / 3,458 / 2,931 | 5,227 |  |

## 2. Time to kill and hits to die

Each build at the zone's expected level, with points split as listed, wearing the zone's full **medium armour set at Rare (blue)** and its weapon at the zone's item level (no affixes or gems), both reinforced as far as that area allows, the weapon at the rarity assumed below. **DPS** is sustained light-attack damage per second (swing until the stamina bar is empty, then wait for it to refill); casters cast their three best damaging spells as often as cooldowns, cast time and stamina allow. **TTK** = seconds of that DPS to kill the zone's average room enemy / its boss (all phases). **Hits** = average hits of the zone's room enemies / the boss's biggest hit to kill the build, after its defense.

| Cycle | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First playthrough | L6 · ilvl 1 · uncommon +0 | L15 · ilvl 2 · uncommon +0 | L26 · ilvl 3 · rare +0 | L37 · ilvl 4 · rare +1 | L47 · ilvl 5 · rare +2 | L57 · ilvl 6 · epic +3 | L67 · ilvl 7 · epic +3 | L76 · ilvl 8 · epic +3 |
| NG+1 | L87 · ilvl 9 · epic +4 | L100 · ilvl 10 · epic +5 | L113 · ilvl 11 · epic +6 | L125 · ilvl 12 · epic +6 | L138 · ilvl 13 · epic +6 | L151 · ilvl 14 · epic +6 | L166 · ilvl 15 · epic +6 | L181 · ilvl 16 · epic +6 |
| NG+2 | L196 · ilvl 17 · epic +7 | L210 · ilvl 18 · epic +8 | L223 · ilvl 19 · epic +9 | L236 · ilvl 20 · epic +9 | L249 · ilvl 21 · epic +9 | L263 · ilvl 22 · epic +9 | L279 · ilvl 23 · epic +9 | L294 · ilvl 24 · epic +9 |

### First playthrough

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 41 dps · 2.2s / 62s · 17.7 / 3.2 hits | 65 dps · 1.9s / 86s · 23.2 / 3.1 hits | 99 dps · 1.7s / 76s · 19.4 / 3.9 hits | 154 dps · 1.4s / 68s · 17.8 / 3.2 hits | 220 dps · 1.2s / 78s · 15.4 / 2.2 hits | 321 dps · 1.1s / 59s · 16.6 / 2.8 hits | 382 dps · 0.9s / 55s · 17.6 / 3 hits | 458 dps · 1.1s / 121s · 18.2 / 1.4 hits |
| Slicey: twin daggers | 26 dps · 3.5s / 97s · 13 / 2.3 hits | 41 dps · 3s / 135s · 17.4 / 2.4 hits | 63 dps · 2.6s / 119s · 14.8 / 3 hits | 99 dps · 2.2s / 106s · 13.8 / 2.5 hits | 143 dps · 1.8s / 120s · 12.1 / 1.7 hits | 211 dps · 1.7s / 89s · 13.2 / 2.2 hits | 254 dps · 1.4s / 83s · 14.2 / 2.4 hits | 297 dps · 1.7s / 186s · 15.2 / 1.1 hits |
| Quality: longsword + shield | 34 dps · 2.7s / 74s · 16.8 / 3 hits | 52 dps · 2.3s / 107s · 22.4 / 3 hits | 79 dps · 2.1s / 96s · 19 / 3.8 hits | 120 dps · 1.8s / 87s · 17.7 / 3.2 hits | 171 dps · 1.5s / 100s · 15.5 / 2.2 hits | 249 dps · 1.4s / 76s · 16.7 / 2.8 hits | 301 dps · 1.2s / 70s · 18 / 3 hits | 350 dps · 1.5s / 158s · 18.9 / 1.4 hits |
| Bow (Slicey) | 26 dps · 3.4s / 96s · 12.2 / 2.2 hits | 41 dps · 3s / 137s · 16.5 / 2.2 hits | 61 dps · 2.7s / 124s · 14.1 / 2.8 hits | 97 dps · 2.2s / 109s · 13.3 / 2.4 hits | 138 dps · 1.8s / 124s · 11.7 / 1.7 hits | 200 dps · 1.8s / 94s · 12.7 / 2.1 hits | 238 dps · 1.5s / 88s · 13.8 / 2.3 hits | 276 dps · 1.8s / 200s · 14.8 / 1.1 hits |
| Crossbow (Bonk) | 27 dps · 3.3s / 92s · 17.7 / 3.2 hits | 43 dps · 2.9s / 131s · 23.2 / 3.1 hits | 63 dps · 2.6s / 119s · 19.4 / 3.9 hits | 97 dps · 2.2s / 109s · 17.8 / 3.2 hits | 142 dps · 1.8s / 121s · 15.4 / 2.2 hits | 206 dps · 1.7s / 91s · 16.6 / 2.8 hits | 245 dps · 1.4s / 86s · 17.6 / 3 hits | 284 dps · 1.8s / 195s · 18.2 / 1.4 hits |
| Brain caster: staff spells | 37 dps · 2.4s / 68s · 12.2 / 2.2 hits | 63 dps · 1.9s / 88s · 16.5 / 2.2 hits | 95 dps · 1.7s / 79s · 14.1 / 2.8 hits | 138 dps · 1.6s / 76s · 13.3 / 2.4 hits | 190 dps · 1.3s / 90s · 11.7 / 1.7 hits | 267 dps · 1.3s / 70s · 12.7 / 2.1 hits | 310 dps · 1.1s / 68s · 13.8 / 2.3 hits | 352 dps · 1.5s / 157s · 14.8 / 1.1 hits |
| Prayer caster: talisman spells | 37 dps · 2.4s / 69s · 13 / 2.3 hits | 33 dps · 3.7s / 167s · 17.4 / 2.4 hits | 49 dps · 3.4s / 155s · 14.8 / 3 hits | 73 dps · 3s / 143s · 13.8 / 2.5 hits | 103 dps · 2.5s / 167s · 12.1 / 1.7 hits | 147 dps · 2.4s / 128s · 13.2 / 2.2 hits | 173 dps · 2s / 122s · 14.2 / 2.4 hits | 199 dps · 2.6s / 278s · 15.2 / 1.1 hits |

- Brain caster: staff spells: Z1 Void Rift, Frost Lance, Fireball; spells 33 + weapon 4 · Z2 Void Rift, Arcane Beam, Frost Lance; spells 61 + weapon 3 · Z3 Meteor, Void Rift, Arcane Beam; spells 90 + weapon 5 · Z4 Meteor, Void Rift, Arcane Beam; spells 130 + weapon 8 · Z5 Meteor, Void Rift, Arcane Beam; spells 178 + weapon 11 · Z6 Meteor, Void Rift, Arcane Beam; spells 251 + weapon 16 · Z7 Meteor, Void Rift, Arcane Beam; spells 291 + weapon 19 · Z8 Meteor, Void Rift, Arcane Beam; spells 329 + weapon 22
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 13 + weapon 23 · Z2 Sunray, Purify; spells 19 + weapon 14 · Z3 Sunray, Purify; spells 27 + weapon 22 · Z4 Sunray, Purify; spells 40 + weapon 34 · Z5 Sunray, Purify; spells 55 + weapon 47 · Z6 Sunray, Purify; spells 78 + weapon 69 · Z7 Sunray, Purify; spells 91 + weapon 82 · Z8 Sunray, Purify; spells 104 + weapon 95

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 74 | 62 | 97 | 1.6 |
| 2 | 131 | 86 | 167 | 2 |
| 3 | 119 | 76 | 155 | 2 |
| 4 | 106 | 68 | 143 | 2.1 |
| 5 | 120 | 78 | 167 | 2.1 |
| 6 | 89 | 59 | 128 | 2.2 |
| 7 | 83 | 55 | 122 | 2.2 |
| 8 | 186 | 121 | 278 | 2.3 |

### NG+1

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 583 dps · 3.2s / 197s · 18.2 / 3 hits | 728 dps · 2.3s / 200s · 15.2 / 3.6 hits | 876 dps · 2s / 205s · 17.8 / 5.2 hits | 956 dps · 2s / 210s · 15.9 / 4.2 hits | 1,042 dps · 1.9s / 216s · 13.3 / 2.5 hits | 1,129 dps · 2.3s / 219s · 14.7 / 2.9 hits | 1,239 dps · 1.9s / 215s · 17 / 3.4 hits | 1,332 dps · 2.3s / 338s · 13.2 / 1.6 hits |
| Slicey: twin daggers | 383 dps · 4.8s / 300s · 15.3 / 2.5 hits | 482 dps · 3.5s / 301s · 12.8 / 3 hits | 598 dps · 2.9s / 301s · 15 / 4.4 hits | 669 dps · 2.9s / 300s · 13.4 / 3.5 hits | 748 dps · 2.7s / 300s · 11.3 / 2.1 hits | 827 dps · 3.1s / 299s · 12.5 / 2.5 hits | 916 dps · 2.5s / 291s · 14.5 / 2.9 hits | 990 dps · 3.1s / 455s · 11.5 / 1.4 hits |
| Quality: longsword + shield | 449 dps · 4.1s / 256s · 18.9 / 3.1 hits | 571 dps · 2.9s / 254s · 15.9 / 3.8 hits | 707 dps · 2.4s / 254s · 18.6 / 5.4 hits | 794 dps · 2.4s / 253s · 16.6 / 4.4 hits | 895 dps · 2.3s / 251s · 14 / 2.6 hits | 994 dps · 2.6s / 249s · 15.5 / 3.1 hits | 1,105 dps · 2.1s / 241s · 18.1 / 3.6 hits | 1,215 dps · 2.5s / 371s · 14.1 / 1.7 hits |
| Bow (Slicey) | 359 dps · 5.1s / 320s · 15 / 2.5 hits | 450 dps · 3.7s / 323s · 12.6 / 3 hits | 552 dps · 3.1s / 326s · 14.8 / 4.3 hits | 616 dps · 3.2s / 326s · 13.2 / 3.5 hits | 692 dps · 2.9s / 325s · 11.1 / 2.1 hits | 763 dps · 3.4s / 325s · 12.3 / 2.4 hits | 838 dps · 2.8s / 318s · 14.4 / 2.9 hits | 908 dps · 3.4s / 496s · 11.4 / 1.4 hits |
| Crossbow (Bonk) | 361 dps · 5.1s / 318s · 18.2 / 3 hits | 452 dps · 3.7s / 322s · 15.2 / 3.6 hits | 565 dps · 3.1s / 318s · 17.8 / 5.2 hits | 629 dps · 3.1s / 319s · 15.9 / 4.2 hits | 698 dps · 2.9s / 322s · 13.3 / 2.5 hits | 768 dps · 3.4s / 322s · 14.7 / 2.9 hits | 844 dps · 2.8s / 315s · 17 / 3.4 hits | 911 dps · 3.4s / 495s · 13.2 / 1.6 hits |
| Brain caster: staff spells | 438 dps · 4.2s / 262s · 15 / 2.5 hits | 536 dps · 3.1s / 271s · 12.6 / 3 hits | 643 dps · 2.7s / 280s · 14.8 / 4.3 hits | 705 dps · 2.8s / 285s · 13.2 / 3.5 hits | 768 dps · 2.6s / 293s · 11.1 / 2.1 hits | 831 dps · 3.1s / 298s · 12.3 / 2.4 hits | 887 dps · 2.6s / 300s · 14.7 / 2.9 hits | 943 dps · 3.3s / 478s · 11.4 / 1.4 hits |
| Prayer caster: talisman spells | 252 dps · 7.3s / 455s · 15.3 / 2.5 hits | 313 dps · 5.3s / 464s · 12.8 / 3 hits | 380 dps · 4.5s / 473s · 15 / 4.4 hits | 421 dps · 4.6s / 477s · 13.4 / 3.5 hits | 466 dps · 4.4s / 483s · 11.3 / 2.1 hits | 509 dps · 5.1s / 487s · 12.5 / 2.5 hits | 548 dps · 4.3s / 486s · 14.8 / 3 hits | 587 dps · 5.3s / 767s · 11.5 / 1.4 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 410 + weapon 28 · Z2 Meteor, Void Rift, Arcane Beam; spells 501 + weapon 35 · Z3 Meteor, Void Rift, Arcane Beam; spells 601 + weapon 42 · Z4 Meteor, Void Rift, Arcane Beam; spells 657 + weapon 48 · Z5 Meteor, Void Rift, Arcane Beam; spells 715 + weapon 53 · Z6 Meteor, Void Rift, Arcane Beam; spells 772 + weapon 59 · Z7 Meteor, Void Rift, Arcane Beam; spells 822 + weapon 64 · Z8 Meteor, Void Rift, Arcane Beam; spells 871 + weapon 71
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 130 + weapon 122 · Z2 Sunray, Purify; spells 160 + weapon 153 · Z3 Sunray, Purify; spells 192 + weapon 188 · Z4 Sunray, Purify; spells 211 + weapon 210 · Z5 Sunray, Purify; spells 230 + weapon 235 · Z6 Sunray, Purify; spells 249 + weapon 259 · Z7 Sunray, Purify; spells 266 + weapon 281 · Z8 Sunray, Purify; spells 282 + weapon 305

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 300 | 197 | 455 | 2.3 |
| 2 | 301 | 200 | 464 | 2.3 |
| 3 | 301 | 205 | 473 | 2.3 |
| 4 | 300 | 210 | 477 | 2.3 |
| 5 | 300 | 216 | 483 | 2.2 |
| 6 | 299 | 219 | 487 | 2.2 |
| 7 | 300 | 215 | 486 | 2.3 |
| 8 | 478 | 338 | 767 | 2.3 |

### NG+2

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 1,538 dps · 3s / 336s · 16.8 / 2.8 hits | 1,754 dps · 2.4s / 334s · 13.6 / 3.3 hits | 1,993 dps · 2.1s / 332s · 15 / 4.4 hits | 2,114 dps · 2.3s / 333s · 12.8 / 3.4 hits | 2,229 dps · 2.2s / 333s · 10.1 / 1.9 hits | 2,353 dps · 2.6s / 333s · 10.9 / 2.2 hits | 2,478 dps · 2.2s / 333s · 12.6 / 2.5 hits | 2,621 dps · 2.8s / 457s · 9.4 / 1.1 hits |
| Slicey: twin daggers | 1,147 dps · 4s / 451s · 14.7 / 2.5 hits | 1,309 dps · 3.2s / 447s · 11.8 / 2.8 hits | 1,488 dps · 2.9s / 445s · 13 / 3.8 hits | 1,583 dps · 3s / 444s · 11.2 / 3 hits | 1,670 dps · 2.9s / 445s · 8.8 / 1.6 hits | 1,768 dps · 3.5s / 443s · 9.5 / 1.9 hits | 1,863 dps · 3s / 443s · 11 / 2.2 hits | 1,959 dps · 3.8s / 612s · 8.2 / 1 hits ⚠1-shot |
| Quality: longsword + shield | 1,447 dps · 3.2s / 357s · 17.9 / 3 hits | 1,687 dps · 2.5s / 347s · 14.4 / 3.5 hits | 1,947 dps · 2.2s / 340s · 16 / 4.7 hits | 2,095 dps · 2.3s / 336s · 13.7 / 3.6 hits | 2,243 dps · 2.2s / 331s · 10.8 / 2 hits | 2,414 dps · 2.6s / 324s · 11.6 / 2.3 hits | 2,581 dps · 2.2s / 320s · 13.5 / 2.7 hits | 2,752 dps · 2.7s / 436s · 10 / 1.2 hits |
| Bow (Slicey) | 1,049 dps · 4.4s / 493s · 14.6 / 2.5 hits | 1,196 dps · 3.5s / 489s · 11.8 / 2.8 hits | 1,372 dps · 3.1s / 483s · 13 / 3.8 hits | 1,455 dps · 3.3s / 483s · 11.1 / 3 hits | 1,534 dps · 3.2s / 484s · 8.8 / 1.6 hits | 1,619 dps · 3.8s / 483s · 9.5 / 1.9 hits | 1,706 dps · 3.3s / 484s · 11 / 2.2 hits | 1,793 dps · 4.1s / 669s · 8.2 / 1 hits ⚠1-shot |
| Crossbow (Bonk) | 1,066 dps · 4.3s / 485s · 16.8 / 2.8 hits | 1,216 dps · 3.4s / 481s · 13.6 / 3.3 hits | 1,382 dps · 3.1s / 479s · 15 / 4.4 hits | 1,466 dps · 3.3s / 480s · 12.8 / 3.4 hits | 1,546 dps · 3.2s / 480s · 10.1 / 1.9 hits | 1,632 dps · 3.8s / 479s · 10.9 / 2.2 hits | 1,720 dps · 3.2s / 480s · 12.6 / 2.5 hits | 1,820 dps · 4.1s / 659s · 9.4 / 1.1 hits |
| Brain caster: staff spells | 1,076 dps · 4.3s / 481s · 14.6 / 2.5 hits | 1,219 dps · 3.4s / 480s · 11.8 / 2.8 hits | 1,371 dps · 3.1s / 483s · 13 / 3.8 hits | 1,439 dps · 3.3s / 488s · 11.1 / 3 hits | 1,508 dps · 3.3s / 492s · 8.8 / 1.6 hits | 1,577 dps · 4s / 496s · 9.5 / 1.9 hits | 1,647 dps · 3.4s / 501s · 11 / 2.2 hits | 1,716 dps · 4.3s / 699s · 8.2 / 1 hits ⚠1-shot |
| Prayer caster: talisman spells | 674 dps · 6.8s / 767s · 14.7 / 2.5 hits | 768 dps · 5.4s / 762s · 11.8 / 2.8 hits | 872 dps · 4.9s / 759s · 13 / 3.8 hits | 921 dps · 5.2s / 763s · 11.2 / 3 hits | 970 dps · 5.1s / 765s · 8.8 / 1.6 hits | 1,020 dps · 6.1s / 768s · 9.5 / 1.9 hits | 1,070 dps · 5.2s / 771s · 11 / 2.2 hits | 1,120 dps · 6.6s / 1,070s · 8.2 / 1 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 993 + weapon 83 · Z2 Meteor, Void Rift, Arcane Beam; spells 1,122 + weapon 97 · Z3 Meteor, Void Rift, Arcane Beam; spells 1,259 + weapon 112 · Z4 Meteor, Void Rift, Arcane Beam; spells 1,319 + weapon 120 · Z5 Meteor, Void Rift, Arcane Beam; spells 1,379 + weapon 129 · Z6 Meteor, Void Rift, Arcane Beam; spells 1,440 + weapon 137 · Z7 Meteor, Void Rift, Arcane Beam; spells 1,500 + weapon 147 · Z8 Meteor, Void Rift, Arcane Beam; spells 1,560 + weapon 156
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 321 + weapon 353 · Z2 Sunray, Purify; spells 363 + weapon 405 · Z3 Sunray, Purify; spells 408 + weapon 465 · Z4 Sunray, Purify; spells 427 + weapon 494 · Z5 Sunray, Purify; spells 447 + weapon 523 · Z6 Sunray, Purify; spells 466 + weapon 553 · Z7 Sunray, Purify; spells 486 + weapon 584 · Z8 Sunray, Purify; spells 505 + weapon 615

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 481 | 336 | 767 | 2.3 |
| 2 | 480 | 334 | 762 | 2.3 |
| 3 | 479 | 332 | 759 | 2.3 |
| 4 | 480 | 333 | 763 | 2.3 |
| 5 | 480 | 331 | 765 | 2.3 |
| 6 | 479 | 324 | 768 | 2.4 |
| 7 | 480 | 320 | 771 | 2.4 |
| 8 | 659 | 436 | 1,070 | 2.5 |

## 3. Gems, compared

Each gem at the level a zone 5 drop has (first playthrough) and a +0% roll, on the quality build (longsword) at zone 5. Weapon gems are compared by how much they raise sustained light-attack DPS; armour gems by how much they raise effective HP against zone 5's room hits. Families that do neither are listed with their raw value.

Gem level 7 (zone 5 drop), +0% roll. Base: 171 DPS, 11.8 average hits to die.

| Gem | Kind | Baseline text | Effect on the build | Notes |
| --- | --- | --- | --- | --- |
| Quicksilver | weapon | +12% attack and cast speed | +3% sustained, +7% burst DPS |  |
| Tempo | weapon | −12% skill cooldowns | — |  |
| Fleetfoot | weapon | −0.6 s dodge recharge | — |  |
| Brutal | weapon | +11% damage | +6% sustained, +6% burst DPS |  |
| Ember | weapon | +13.2% of the hit as Fire, Burn buildup | +8% sustained, +8% burst DPS |  |
| Rime | weapon | +13.2% of the hit as Magic (frost), Chill buildup | +8% sustained, +8% burst DPS |  |
| Storm | weapon | +13.2% of the hit as Magic (lightning), Shock buildup | +8% sustained, +8% burst DPS |  |
| Dawn | weapon | +13.2% of the hit as Holy | +8% sustained, +8% burst DPS |  |
| Dusk | weapon | +13.2% of the hit as Void | +8% sustained, +8% burst DPS |  |
| Leech | weapon | 4% lifesteal | — | heals 8% max HP per 10 s of attacking |
| Vigor | weapon | −16% stamina costs | +7% sustained, +0% burst DPS |  |
| Bulwark | armour | +16 defense to all types | +5% effective HP |  |
| Hearth | armour | +8% max HP | +5% effective HP |  |
| Zephyr | armour | +16% stamina regeneration | — |  |
| Gilt | armour | +11% Glowen found | — |  |

## 4. Weapons, weapon skills and spells

Every weapon at item level 5, rare, +0, held by a knight whose points (10 in each damage stat, plus 45 shared by the weapon's grades in proportion to their weight) suit that weapon. Best grip (one- or two-handed). Skills: listed damage multipliers × the weapon's power, per second of cooldown (single target; utility skills show 0).

| Weapon | Grades | Grip | Burst DPS | Sustained DPS | Per swing | Stamina/swing | Skills (dmg per s of cooldown) | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greathammer | S/- | 2H | 458 | 160 | 553 | 48.3 | Earthshaker 106, Meteor Lunge 86, Unstoppable 0 |  |
| Greataxe | A/- | 2H | 433 | 144 | 423 | 41.4 | Cleave Spin 66, Execute 37, Bloodlust 0 |  |
| Colossal Sword | A/E | 2H | 454 | 152 | 464 | 43.1 | Guillotine 84, Stomp 31, Charged Swing 97 |  |
| Crossbow | B/- | 2H | 338 | 113 | 332 | 41.4 | Piercing Bolt 59, Explosive Bolt 36, Rapid Fire 66 |  |
| Club | E/- | 2H | 370 | 138 | 319 | 31.1 | Bonk 72, Wild Swing 34, Tantrum 0 |  |
| Twin Daggers | -/S | 1H | 294 | 101 | 99 | 13.8 | Shadow Step 48, Fan of Knives 13, Flurry 54 |  |
| Rapier | -/A | 1H | 341 | 125 | 174 | 19 | Lunge 48, Riposte Stance 0, Thousand Cuts 52 |  |
| Katana | D/A | 2H | 402 | 149 | 226 | 20.7 | Iai Slash 53, Crescent 32, Blood Moon 0 |  |
| Bow | -/B | 2H | 285 | 107 | 273 | 34.5 | Volley 75, Piercing Shot 38, Rain 14 |  |
| Whip | -/E | 1H | 321 | 138 | 230 | 20.7 | Lash 52, Crack 28, Serpent Coil 54 |  |
| Longsword | B/B | 2H | 426 | 155 | 288 | 25.9 | Shield Breaker 59, Spin Slash 33, Battle Cry 0 |  |
| Spear | C/B | 2H | 393 | 141 | 245 | 24.2 | Impale 59, Sweep 28, Phalanx 0 |  |
| Battleaxe | A/D | 2H | 470 | 162 | 359 | 31.1 | Cleave 69, Hook 31, Frenzy 0 |  |
| Mace | B/E | 2H | 392 | 147 | 341 | 31.1 | Holy Smite 61, Consecrate 33, Judgment 22 |  |
| Halberd | A/C | 2H | 453 | 166 | 363 | 29.3 | Moulinet 93, Hook Pull 32, Vault 40 |  |
| Twin Axes | C/B | 2H | 365 | 132 | 198 | 20.7 | Whirlwind 71, Throw 32, Rampage 0 |  |
| Hollow Maul | B/-/Br B | 2H | 387 | 135 | 407 | 41.4 | Singularity 57, Event Horizon 86, Null Shell 0 |  |
| Spellblade | -/B/Br B | 1H | 388 | 143 | 253 | 24.2 | Arc Wave 40, Blink Strike 36, Runic Edge 0 |  |
| Censer Flail | B/-/Pr B | 2H | 439 | 154 | 344 | 31.1 | Incense 61, Brimstone 52, Sanctified Flame 0 |  |
| Dawn Glaive | -/B/Pr B | 1H | 395 | 145 | 300 | 27.6 | Sunrise 54, Halo Throw 32, Judgement Ray 36 |  |

Spells at Spell Skill 100 (single target; fans count one projectile, ticking areas their whole duration):

| Spell | School | Damage | Cast s | Cooldown s | Stamina | Dmg / busy s | Dmg / stamina | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arcane Bolt | brain | 19 | 0.3 | 1.2 | 8 | 16 | 2.4 |  |
| Scatter Shards | brain | 14 | 0.4 | 4 | 14 | 3.5 | 1 |  |
| Frost Lance | brain | 40 | 0.5 | 5 | 16 | 8 | 2.5 |  |
| Fireball | brain | 48 | 0.6 | 6 | 18 | 8 | 2.7 |  |
| Chain Lightning | brain | 36 | 0.5 | 7 | 18 | 5.1 | 2 |  |
| Void Rift | brain | 96 | 0.7 | 9 | 22 | 10.7 | 4.4 |  |
| Arcane Beam | brain | 180 | 2.1 | 11 | 30 | 16.4 | 6 | ⚠ 2.05× school median DPS |
| Meteor | brain | 160 | 0.8 | 16 | 34 | 10 | 4.7 |  |
| Comet Barrage | brain | 63 | 1 | 22 | 40 | 2.9 | 1.6 | ⚠ 0.36× school median DPS |
| Purify | prayer | 30 | 0.5 | 10 | 12 | 3 | 2.5 |  |
| Sunray | prayer | 36 | 0.5 | 6 | 14 | 6 | 2.6 |  |

## 5. Economy

Shards from clearing every room of a zone once (solo, averaged over seeds; tuning.ts), against what its levels cost (GAME_DESIGN §2.3 target: 80–120%).

| Zone | Levels | Shards (rooms) | Shards needed | Yield | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 → 10 | 1,871 | 1,963 | 95% |  |
| 2 | 10 → 20 | 4,061 | 3,912 | 104% |  |
| 3 | 20 → 32 | 6,686 | 6,836 | 98% |  |
| 4 | 32 → 42 | 8,630 | 8,484 | 102% |  |
| 5 | 42 → 52 | 12,072 | 11,653 | 104% |  |
| 6 | 52 → 62 | 15,842 | 15,742 | 101% |  |
| 7 | 62 → 72 | 22,362 | 21,264 | 105% |  |
| 8 | 72 → 80 | 23,753 | 22,444 | 106% |  |

New Game+: levels one clear of each zone (rooms and boss) buys, from level 80:

| Cycle | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NG+1 | 40,954 → L87 | 34,882 → L100 | 37,760 → L113 | 34,115 → L125 | 38,788 → L138 | 40,022 → L151 | 47,582 → L166 | 42,447 → L181 |
| NG+2 | 45,227 → L196 | 39,408 → L210 | 42,090 → L223 | 37,165 → L236 | 42,785 → L249 | 45,177 → L263 | 53,067 → L279 | 45,671 → L294 |

Reinforcement: each +1 is +20% (×4 at +15), against rarity steps of ×1.06–×1.28. Glowen per step:

| + | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 | +11 | +12 | +13 | +14 | +15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Glowen | 100 | 145 | 210 | 305 | 442 | 641 | 929 | 1,348 | 1,954 | 2,833 | 4,108 | 5,957 | 8,638 | 12,525 | 18,162 |
| Power | ×1.15 | ×1.3 | ×1.45 | ×1.6 | ×1.75 | ×1.9 | ×2.05 | ×2.2 | ×2.35 | ×2.5 | ×2.65 | ×2.8 | ×2.95 | ×3.1 | ×3.25 |

## 6. Growth: player against the world

How the quality build's damage and toughness grow against the zone's enemies (zone 1 of the first playthrough = 1.00). A healthy curve keeps both ratios near 1.

| Cycle | Zone | Level | DPS | Foe HP | TTK s | Max HP | Hit taken | Hits to die | Kill time × | Survival × | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First playthrough | 1 | L6 | 34 | 90 | 2.7 | 293 | 22 | 13.1 | 1 | 1 |  |
| First playthrough | 2 | L15 | 52 | 122 | 2.3 | 345 | 22 | 15.5 | 0.88 | 1.18 |  |
| First playthrough | 3 | L26 | 79 | 166 | 2.1 | 398 | 33 | 12.2 | 0.79 | 0.93 |  |
| First playthrough | 4 | L37 | 120 | 217 | 1.8 | 450 | 36 | 12.6 | 0.68 | 0.96 |  |
| First playthrough | 5 | L47 | 171 | 253 | 1.5 | 503 | 43 | 11.8 | 0.56 | 0.9 |  |
| First playthrough | 6 | L57 | 249 | 354 | 1.4 | 555 | 49 | 11.2 | 0.54 | 0.86 |  |
| First playthrough | 7 | L67 | 301 | 351 | 1.2 | 608 | 48 | 12.6 | 0.44 | 0.96 |  |
| First playthrough | 8 | L76 | 350 | 510 | 1.5 | 645 | 52 | 12.3 | 0.55 | 0.94 |  |
| NG+1 | 1 | L87 | 449 | 1,837 | 4.1 | 675 | 46 | 14.8 | 1.54 | 1.13 |  |
| NG+1 | 2 | L100 | 571 | 1,669 | 2.9 | 715 | 65 | 10.9 | 1.1 | 0.83 |  |
| NG+1 | 3 | L113 | 707 | 1,723 | 2.4 | 755 | 65 | 11.7 | 0.92 | 0.89 |  |
| NG+1 | 4 | L125 | 794 | 1,940 | 2.4 | 795 | 66 | 12 | 0.92 | 0.92 |  |
| NG+1 | 5 | L138 | 895 | 2,026 | 2.3 | 835 | 77 | 10.8 | 0.85 | 0.82 |  |
| NG+1 | 6 | L151 | 994 | 2,585 | 2.6 | 875 | 84 | 10.4 | 0.98 | 0.79 |  |
| NG+1 | 7 | L166 | 1,105 | 2,329 | 2.1 | 915 | 74 | 12.4 | 0.79 | 0.95 |  |
| NG+1 | 8 | L181 | 1,215 | 3,084 | 2.5 | 940 | 104 | 9.1 | 0.96 | 0.69 |  |
| NG+2 | 1 | L196 | 1,447 | 4,575 | 3.2 | 955 | 69 | 13.9 | 1.19 | 1.06 |  |
| NG+2 | 2 | L210 | 1,687 | 4,141 | 2.5 | 970 | 98 | 9.9 | 0.92 | 0.76 |  |
| NG+2 | 3 | L223 | 1,947 | 4,261 | 2.2 | 985 | 99 | 9.9 | 0.82 | 0.76 |  |
| NG+2 | 4 | L236 | 2,095 | 4,765 | 2.3 | 1,000 | 101 | 9.9 | 0.86 | 0.76 |  |
| NG+2 | 5 | L249 | 2,243 | 4,917 | 2.2 | 1,015 | 122 | 8.3 | 0.83 | 0.64 |  |
| NG+2 | 6 | L263 | 2,414 | 6,232 | 2.6 | 1,030 | 132 | 7.8 | 0.97 | 0.6 |  |
| NG+2 | 7 | L279 | 2,581 | 5,556 | 2.2 | 1,049 | 114 | 9.2 | 0.81 | 0.7 |  |
| NG+2 | 8 | L294 | 2,752 | 7,386 | 2.7 | 1,064 | 165 | 6.4 | 1.01 | 0.49 | ⚠ survives 2× fewer hits |

