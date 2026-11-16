# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Slicey: twin daggers build (680 HP) in one hit (0.86). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
2. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Bow (Slicey) build (672 HP) in one hit (0.85). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
3. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Brain caster: staff spells build (672 HP) in one hit (0.85). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
4. **Build spread** (severity 5.2): NG+5 zone 8: the slowest build (Prayer caster: talisman spells) takes 919 s on the boss, 4.3× the fastest (Quality: longsword + shield, 212 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
5. **Build spread** (severity 5.2): NG+5 zone 6: the slowest build (Prayer caster: talisman spells) takes 666 s on the boss, 4.3× the fastest (Quality: longsword + shield, 154 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
6. **Build spread** (severity 5.2): NG+6 zone 1: the slowest build (Prayer caster: talisman spells) takes 630 s on the boss, 4.3× the fastest (Quality: longsword + shield, 146 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
7. **Gems** (severity 4.6): Quicksilver raises sustained DPS by +3% (burst +7%) where Brutal gives +6% (0.41× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
8. **Boss length** (severity 4.5): NG+5 zone 8: the median build needs 460 s of nonstop hitting to kill The Landlord (3,981,273 HP), 7.7 minutes before any dodging (target 11 min, D301). *Suggested:* Raise its NG_BOSS_HP factor (D301).
9. **Weapons** (severity 4.4): Katana: 266 sustained light-attack DPS, 1.73× the median weapon (154) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
10. **Boss length** (severity 4.3): NG+4 zone 8: the median build needs 390 s of nonstop hitting to kill The Landlord (2,769,325 HP), 6.5 minutes before any dodging (target 11 min, D301). *Suggested:* Raise its NG_BOSS_HP factor (D301).
11. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
12. **Boss length** (severity 4.2): NG+7 zone 1: the median build needs 360 s of nonstop hitting to kill The Caretaker (3,690,201 HP), 6 minutes before any dodging (target 8 min, D301). *Suggested:* Raise its NG_BOSS_HP factor (D301).
13. **Weapons** (severity 4.1): Twin Daggers: 250 sustained light-attack DPS, 1.62× the median weapon (154) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
14. **Weapons** (severity 4.1): Crossbow: 96 sustained light-attack DPS, 0.62× the median weapon (154) at equal fitting stats. *Suggested:* Raise its base damage / combo multipliers (D40: poor scaling should mean higher base, not lower DPS).
15. **Builds** (severity 4): First playthrough zone 1: the Brain caster: S staff (Archmagister's Rod) build at level 6 does not meet its own casting tool's requirements at item level 1 (40% damage, no skills). *Suggested:* Item-level requirements (+2 a level on the primary stat) outpace the points a focused build has; ease reqAtIlvl or the NG+ item level.
16. **Builds** (severity 4): First playthrough zone 2: the Brain caster: S staff (Archmagister's Rod) build at level 15 does not meet its own casting tool's requirements at item level 2 (40% damage, no skills). *Suggested:* Item-level requirements (+2 a level on the primary stat) outpace the points a focused build has; ease reqAtIlvl or the NG+ item level.
17. **Enemy curve** (severity 3.8): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 108. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
18. **Weapons** (severity 3.7): Chakrams: 104 sustained light-attack DPS, 0.67× the median weapon (154) at equal fitting stats. *Suggested:* Raise its base damage / combo multipliers (D40: poor scaling should mean higher base, not lower DPS).
19. **Spells** (severity 3.5): Arcane Beam (brain): 16.4 damage per busy second at Spell Skill 100, 2.05× the brain median (8). *Suggested:* Lengthen its cooldown or lower its base.
20. **Weapons** (severity 3.5): Twin Axes: 219 sustained light-attack DPS, 1.42× the median weapon (154) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
21. **Enemy curve** (severity 3.4): NG+4: zone 7 room enemies have 23,519 HP on average, below zone 6's 26,699. *Suggested:* Check the zone roster mix and the HP curve.
22. **Enemy curve** (severity 3.3): NG+6: zone 7 room enemies have 35,545 HP on average, below zone 6's 39,993. *Suggested:* Check the zone roster mix and the HP curve.
23. **Enemy curve** (severity 3.2): NG+3: zone 2 room enemies have 10,968 HP on average, below zone 1's 12,318. *Suggested:* Check the zone roster mix and the HP curve.
24. **Boss curve** (severity 3.2): NG+1: Foreman Ignatius (zone 5) has 111,403 HP over all phases, below zone 4's boss (113,929). *Suggested:* Raise its baseHp / phase bars, or lower the previous boss.
25. **Gear power** (severity 3): Reinforcement reaches ×3.25 at +15, while the whole rarity ladder is ×1.28: a +15 common out-hits a +0 legendary 2.5×, so drops matter little once reinforcement starts. *Suggested:* Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.
26. **Boss curve** (severity 2.9): NG+1: The Bloatking (zone 3) averages 631 a hit, below zone 2's boss (705). *Suggested:* Raise its phase damage multipliers.

(154 more findings of the same kinds are in the tables below.)

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
| 8 | 521 | 81–1,212 | 100 | 19–386 | ⚠ hits softer than zone 7 |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 36 (70) | 51 (109) | 59 (147) | 88 (178) | 98 (208) | 124 (238) | 156 (273) | 97 (314) |
| brute | 39 (180) | 54 (279) | 97 (378) | 131 (457) | 114 (535) | 198 (856) | 262 (701) | 239 (1,212) |
| caster | 28 (55) | 24 (85) | 35 (116) | 57 (140) | 53 (163) | 73 (187) | 92 (214) | 61 (247) |
| fodder | 22 (60) | 23 (102) | 27 (113) | 42 (152) | 56 (196) | 65 (245) | 83 (281) | 75 (350) |
| hazard | 21 (80) | 22 (124) | 48 (218) | 36 (203) | 63 (285) | 89 (272) | 84 (312) | 110 (718) |
| ranged | 18 (50) | 19 (78) | 41 (105) | 43 (127) | 52 (149) | 57 (170) | 84 (292) | 62 (224) |
| support | 17 (55) | 21 (85) | — | 42 (140) | 100 (163) | 61 (187) | 69 (214) | 80 (247) |
| swarm | 8 (18) | 8 (28) | 10 (38) | 15 (46) | 20 (53) | 18 (61) | 35 (70) | 28 (81) |
| tank | 33 (150) | 44 (233) | 57 (315) | 74 (571) | 105 (579) | 113 (663) | 131 (877) | 126 (909) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 2 | 1,260 / 1,260 | 2,520 | 59 / 65 | 101 |  |
| 2 | Mother Spore | 2 | 2,790 / 2,790 | 5,580 | 59 / 90 | 152 |  |
| 3 | The Bloatking | 2 | 3,780 / 3,780 | 7,560 | 86 / 111 | 153 |  |
| 4 | Vexthorn, the Hollow Stag | 2 | 5,257 / 5,257 | 10,514 | 119 / 167 | 241 |  |
| 5 | Foreman Ignatius | 2 | 6,417 / 10,697 | 17,114 | 152 / 220 | 388 |  |
| 6 | Saint Aurelia the Unthawed | 2 | 4,710 / 14,131 | 18,841 | 160 / 243 | 391 |  |
| 7 | Archmagister Tock | 2 | 12,626 / 8,417 | 21,043 | 256 / 388 | 508 |  |
| 8 | The Landlord | 4 | 13,732 / 13,328 / 13,327 / 15,994 | 56,381 | 320 / 408 / 601 / 509 | 908 |  |

### NG+1

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 780 | 156–1,563 | 129 | 40–240 |  |
| 2 | 987 | 225–2,248 | 219 | 41–534 |  |
| 3 | 1,518 | 346–3,458 | 223 | 42–698 |  |
| 4 | 1,916 | 404–5,053 | 244 | 46–696 |  |
| 5 | 2,065 | 437–4,731 | 254 | 63–538 |  |
| 6 | 2,753 | 476–6,658 | 269 | 45–672 |  |
| 7 | 2,464 | 492–6,147 | 277 | 77–817 | ⚠ HP below zone 6 |
| 8 | 3,481 | 540–8,096 | 299 | 58–1,154 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 182 (608) | 388 (874) | 301 (1,345) | 379 (1,572) | 347 (1,698) | 366 (1,849) | 401 (1,912) | 289 (2,099) |
| brute | 193 (1,563) | 410 (2,248) | 500 (3,458) | 561 (4,043) | 404 (4,367) | 585 (6,658) | 673 (4,917) | 715 (8,096) |
| caster | 138 (478) | 181 (687) | 177 (1,057) | 245 (1,235) | 186 (1,334) | 216 (1,453) | 236 (1,503) | 181 (1,649) |
| fodder | 108 (521) | 175 (824) | 137 (1,037) | 178 (1,348) | 198 (1,601) | 193 (1,902) | 213 (1,967) | 223 (2,339) |
| hazard | 105 (695) | 164 (999) | 244 (1,998) | 155 (1,797) | 225 (2,329) | 261 (2,114) | 215 (2,185) | 330 (4,798) |
| ranged | 90 (434) | 144 (624) | 209 (961) | 184 (1,123) | 186 (1,213) | 168 (1,321) | 215 (2,049) | 186 (1,499) |
| support | 83 (478) | 158 (687) | — | 181 (1,235) | 355 (1,334) | 180 (1,453) | 177 (1,503) | 238 (1,649) |
| swarm | 40 (156) | 62 (225) | 49 (346) | 66 (404) | 70 (437) | 52 (476) | 89 (492) | 82 (540) |
| tank | 163 (1,302) | 334 (1,873) | 295 (2,882) | 318 (5,053) | 373 (4,731) | 334 (5,152) | 335 (6,147) | 375 (6,072) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 14,848 / 22,272 / 22,272 | 59,393 | 519 / 570 / 654 | 1,019 |  |
| 2 | Mother Spore | 3 | 18,828 / 28,242 / 28,242 | 75,313 | 453 / 687 / 843 | 1,336 |  |
| 3 | The Bloatking | 3 | 24,874 / 37,311 / 37,311 | 99,496 | 471 / 607 / 740 | 963 | ⚠ hits softer than zone 2's boss |
| 4 | Vexthorn, the Hollow Stag | 3 | 28,482 / 42,723 / 42,723 | 113,929 | 563 / 788 / 938 | 1,308 |  |
| 5 | Foreman Ignatius | 3 | 41,776 / 34,814 / 34,814 | 111,403 | 626 / 907 / 1,057 | 1,844 | ⚠ less HP than zone 4's boss |
| 6 | Saint Aurelia the Unthawed | 3 | 15,742 / 55,099 / 55,099 | 125,940 | 604 / 917 / 1,003 | 1,697 |  |
| 7 | Archmagister Tock | 3 | 42,169 / 49,197 / 49,197 | 140,563 | 859 / 1,300 / 1,540 | 1,961 |  |
| 8 | The Landlord | 4 | 62,027 / 60,203 / 60,202 / 72,244 | 254,676 | 1,015 / 1,291 / 1,904 / 1,613 | 2,878 |  |

### NG+2

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 4,747 | 952–9,516 | 312 | 96–578 |  |
| 2 | 5,281 | 1,203–12,034 | 531 | 99–1,293 |  |
| 3 | 5,963 | 1,359–13,587 | 555 | 104–1,738 |  |
| 4 | 6,935 | 1,463–18,292 | 627 | 119–1,785 |  |
| 5 | 7,566 | 1,600–17,338 | 672 | 166–1,422 |  |
| 6 | 10,091 | 1,743–24,403 | 723 | 120–1,807 |  |
| 7 | 9,429 | 1,882–23,521 | 768 | 215–2,266 | ⚠ HP below zone 6 |
| 8 | 12,920 | 2,003–30,046 | 837 | 161–3,228 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 439 (3,701) | 940 (4,680) | 750 (5,284) | 972 (5,691) | 917 (6,224) | 984 (6,779) | 1,113 (7,318) | 807 (7,790) |
| brute | 466 (9,516) | 994 (12,034) | 1,246 (13,587) | 1,438 (14,634) | 1,069 (16,004) | 1,573 (24,403) | 1,869 (18,817) | 1,999 (30,046) |
| caster | 331 (2,908) | 438 (3,677) | 442 (4,152) | 627 (4,471) | 493 (4,890) | 580 (5,326) | 656 (5,750) | 507 (6,121) |
| fodder | 260 (3,172) | 425 (4,412) | 342 (4,076) | 457 (4,878) | 524 (5,868) | 519 (6,972) | 590 (7,527) | 623 (8,680) |
| hazard | 253 (4,229) | 398 (5,348) | 608 (7,850) | 397 (6,504) | 595 (8,536) | 703 (7,747) | 596 (8,363) | 922 (17,805) |
| ranged | 217 (2,643) | 348 (3,343) | 521 (3,774) | 471 (4,065) | 491 (4,446) | 452 (4,842) | 596 (7,840) | 519 (5,564) |
| support | 199 (2,908) | 383 (3,677) | — | 463 (4,471) | 939 (4,890) | 483 (5,326) | 492 (5,750) | 666 (6,121) |
| swarm | 96 (952) | 149 (1,203) | 122 (1,359) | 169 (1,463) | 186 (1,600) | 141 (1,743) | 247 (1,882) | 231 (2,003) |
| tank | 392 (7,930) | 808 (10,028) | 734 (11,322) | 816 (18,292) | 986 (17,338) | 897 (18,884) | 930 (23,521) | 1,049 (22,535) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 75,414 / 113,121 / 113,121 | 301,657 | 1,250 / 1,372 / 1,576 | 2,455 |  |
| 2 | Mother Spore | 3 | 88,594 / 132,892 / 132,892 | 354,378 | 954 / 1,448 / 1,777 | 2,814 |  |
| 3 | The Bloatking | 3 | 104,034 / 156,051 / 156,051 | 416,135 | 1,174 / 1,513 / 1,843 | 2,400 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 112,108 / 168,163 / 168,163 | 448,434 | 1,442 / 2,020 / 2,404 | 3,353 |  |
| 5 | Foreman Ignatius | 3 | 183,482 / 152,902 / 152,902 | 489,286 | 1,656 / 2,400 / 2,797 | 4,879 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 66,073 / 231,254 / 231,254 | 528,581 | 1,623 / 2,464 / 2,696 | 4,562 |  |
| 7 | Archmagister Tock | 3 | 166,809 / 194,611 / 194,611 | 556,030 | 2,383 / 3,608 / 4,275 | 5,442 |  |
| 8 | The Landlord | 4 | 194,626 / 188,902 / 188,901 / 226,682 | 799,110 | 2,837 / 3,611 / 5,324 / 4,512 | 8,048 |  |

### NG+3

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 12,318 | 2,469–24,691 | 570 | 176–1,057 |  |
| 2 | 10,968 | 2,499–24,990 | 1,000 | 187–2,436 | ⚠ HP below zone 1 |
| 3 | 11,551 | 2,632–26,319 | 1,065 | 200–3,334 |  |
| 4 | 12,652 | 2,670–33,372 | 1,196 | 227–3,407 |  |
| 5 | 13,389 | 2,832–30,679 | 1,300 | 320–2,751 |  |
| 6 | 16,840 | 2,909–40,727 | 1,417 | 236–3,542 |  |
| 7 | 15,193 | 3,032–37,899 | 1,573 | 440–4,641 | ⚠ HP below zone 6 |
| 8 | 20,132 | 3,121–46,819 | 1,725 | 333–6,651 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 801 (9,602) | 1,771 (9,718) | 1,439 (10,235) | 1,855 (10,382) | 1,774 (11,013) | 1,928 (11,313) | 2,280 (11,791) | 1,663 (12,138) |
| brute | 851 (24,691) | 1,874 (24,990) | 2,389 (26,319) | 2,744 (26,697) | 2,067 (28,319) | 3,083 (40,727) | 3,827 (30,319) | 4,117 (46,819) |
| caster | 605 (7,544) | 825 (7,636) | 848 (8,042) | 1,197 (8,158) | 954 (8,653) | 1,136 (8,889) | 1,343 (9,264) | 1,045 (9,537) |
| fodder | 475 (8,230) | 801 (9,163) | 656 (7,896) | 873 (8,899) | 1,013 (10,384) | 1,018 (11,636) | 1,209 (12,128) | 1,283 (13,525) |
| hazard | 462 (10,974) | 750 (11,107) | 1,167 (15,207) | 757 (11,866) | 1,150 (15,103) | 1,377 (12,929) | 1,221 (13,475) | 1,900 (27,744) |
| ranged | 396 (6,859) | 656 (6,942) | 1,000 (7,311) | 899 (7,416) | 950 (7,866) | 885 (8,081) | 1,221 (12,633) | 1,069 (8,670) |
| support | 363 (7,544) | 721 (7,636) | — | 885 (8,158) | 1,816 (8,653) | 947 (8,889) | 1,008 (9,264) | 1,372 (9,537) |
| swarm | 176 (2,469) | 281 (2,499) | 233 (2,632) | 322 (2,670) | 360 (2,832) | 275 (2,909) | 505 (3,032) | 475 (3,121) |
| tank | 715 (20,576) | 1,523 (20,825) | 1,408 (21,933) | 1,558 (33,372) | 1,907 (30,679) | 1,759 (31,515) | 1,905 (37,899) | 2,162 (35,114) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 201,595 / 302,393 / 302,393 | 806,381 | 2,283 / 2,508 / 2,880 | 4,486 |  |
| 2 | Mother Spore | 3 | 221,215 / 331,822 / 331,822 | 884,859 | 1,798 / 2,728 / 3,348 | 5,303 |  |
| 3 | The Bloatking | 3 | 245,504 / 368,256 / 368,256 | 982,016 | 2,251 / 2,901 / 3,534 | 4,602 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 249,858 / 374,788 / 374,788 | 999,434 | 2,754 / 3,857 / 4,590 | 6,401 |  |
| 5 | Foreman Ignatius | 3 | 381,124 / 317,604 / 317,604 | 1,016,333 | 3,204 / 4,642 / 5,410 | 9,437 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 129,716 / 454,005 / 454,005 | 1,037,725 | 3,181 / 4,831 / 5,284 | 8,943 |  |
| 7 | Archmagister Tock | 3 | 316,733 / 369,521 / 369,521 | 1,055,775 | 4,881 / 7,388 / 8,755 | 11,143 |  |
| 8 | The Landlord | 4 | 360,264 / 349,668 / 349,667 / 419,601 | 1,479,199 | 5,845 / 7,440 / 10,968 / 9,296 | 16,580 |  |

### NG+4

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 19,317 | 3,872–38,720 | 980 | 303–1,817 |  |
| 2 | 17,287 | 3,939–39,389 | 1,727 | 323–4,205 | ⚠ HP below zone 1 |
| 3 | 17,759 | 4,046–40,464 | 1,836 | 345–5,749 |  |
| 4 | 20,038 | 4,228–52,855 | 2,071 | 393–5,899 |  |
| 5 | 20,678 | 4,374–47,382 | 2,244 | 552–4,747 |  |
| 6 | 26,699 | 4,612–64,571 | 2,408 | 401–6,019 |  |
| 7 | 23,519 | 4,693–58,668 | 2,643 | 739–7,798 | ⚠ HP below zone 6 |
| 8 | 31,917 | 4,948–74,226 | 2,816 | 543–10,861 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 1,378 (15,058) | 3,057 (15,318) | 2,482 (15,736) | 3,212 (16,444) | 3,061 (17,009) | 3,277 (17,936) | 3,831 (18,252) | 2,715 (19,244) |
| brute | 1,464 (38,720) | 3,235 (39,389) | 4,120 (40,464) | 4,752 (42,284) | 3,567 (43,737) | 5,239 (64,571) | 6,430 (46,934) | 6,723 (74,226) |
| caster | 1,041 (11,831) | 1,423 (12,035) | 1,462 (12,364) | 2,073 (12,920) | 1,645 (13,364) | 1,931 (14,093) | 2,257 (14,341) | 1,707 (15,120) |
| fodder | 818 (12,907) | 1,383 (14,443) | 1,132 (12,139) | 1,512 (14,095) | 1,748 (16,037) | 1,731 (18,449) | 2,032 (18,774) | 2,095 (21,443) |
| hazard | 795 (17,209) | 1,294 (17,506) | 2,012 (23,379) | 1,311 (18,793) | 1,985 (23,326) | 2,341 (20,499) | 2,052 (20,860) | 3,103 (43,986) |
| ranged | 682 (10,756) | 1,132 (10,941) | 1,725 (11,240) | 1,557 (11,746) | 1,640 (12,149) | 1,505 (12,812) | 2,052 (19,556) | 1,745 (13,746) |
| support | 625 (11,831) | 1,245 (12,035) | — | 1,532 (12,920) | 3,133 (13,364) | 1,609 (14,093) | 1,693 (14,341) | 2,240 (15,120) |
| swarm | 303 (3,872) | 485 (3,939) | 402 (4,046) | 557 (4,228) | 621 (4,374) | 468 (4,612) | 848 (4,693) | 776 (4,948) |
| tank | 1,231 (32,267) | 2,628 (32,824) | 2,429 (33,720) | 2,698 (52,855) | 3,291 (47,382) | 2,989 (49,965) | 3,201 (58,668) | 3,530 (55,669) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 361,149 / 541,723 / 541,723 | 1,444,594 | 3,927 / 4,313 / 4,953 | 7,715 |  |
| 2 | Mother Spore | 3 | 400,010 / 600,015 / 600,015 | 1,600,041 | 3,105 / 4,710 / 5,779 | 9,155 |  |
| 3 | The Bloatking | 3 | 441,672 / 662,507 / 662,507 | 1,766,686 | 3,882 / 5,003 / 6,094 | 7,936 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 455,779 / 683,668 / 683,668 | 1,823,116 | 4,768 / 6,678 / 7,948 | 11,083 |  |
| 5 | Foreman Ignatius | 3 | 697,838 / 581,533 / 581,533 | 1,860,904 | 5,528 / 8,010 / 9,335 | 16,283 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 239,452 / 838,080 / 838,080 | 1,915,612 | 5,406 / 8,209 / 8,980 | 15,197 |  |
| 7 | Archmagister Tock | 3 | 589,489 / 687,737 / 687,737 | 1,964,962 | 8,201 / 12,414 / 14,711 | 18,723 |  |
| 8 | The Landlord | 4 | 674,478 / 654,640 / 654,639 / 785,568 | 2,769,325 | 9,546 / 12,149 / 17,911 / 15,180 | 27,075 |  |

### NG+5

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 23,380 | 4,686–46,864 | 1,301 | 402–2,413 |  |
| 2 | 21,758 | 4,958–49,576 | 2,246 | 421–5,471 | ⚠ HP below zone 1 |
| 3 | 22,616 | 5,153–51,530 | 2,310 | 434–7,233 |  |
| 4 | 25,399 | 5,360–66,996 | 2,534 | 481–7,217 |  |
| 5 | 26,210 | 5,544–60,058 | 2,691 | 662–5,692 |  |
| 6 | 32,869 | 5,678–79,491 | 2,823 | 470–7,056 |  |
| 7 | 29,709 | 5,929–74,107 | 3,039 | 850–8,967 | ⚠ HP below zone 6 |
| 8 | 39,949 | 6,194–92,904 | 3,239 | 624–12,490 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 1,830 (18,225) | 3,977 (19,279) | 3,122 (20,039) | 3,929 (20,843) | 3,670 (21,559) | 3,842 (22,081) | 4,405 (23,056) | 3,122 (24,086) |
| brute | 1,944 (46,864) | 4,208 (49,576) | 5,184 (51,530) | 5,813 (53,597) | 4,278 (55,438) | 6,141 (79,491) | 7,394 (59,286) | 7,732 (92,904) |
| caster | 1,383 (14,320) | 1,852 (15,148) | 1,840 (15,745) | 2,536 (16,377) | 1,973 (16,940) | 2,264 (17,349) | 2,596 (18,115) | 1,963 (18,925) |
| fodder | 1,086 (15,621) | 1,799 (18,178) | 1,424 (15,459) | 1,849 (17,866) | 2,096 (20,327) | 2,029 (22,712) | 2,336 (23,714) | 2,409 (26,839) |
| hazard | 1,056 (20,828) | 1,683 (22,034) | 2,532 (29,773) | 1,604 (23,821) | 2,380 (29,567) | 2,744 (25,235) | 2,360 (26,349) | 3,569 (55,054) |
| ranged | 905 (13,018) | 1,473 (13,771) | 2,170 (14,314) | 1,904 (14,888) | 1,966 (15,400) | 1,764 (15,772) | 2,360 (24,702) | 2,007 (17,205) |
| support | 830 (14,320) | 1,620 (15,148) | — | 1,874 (16,377) | 3,757 (16,940) | 1,887 (17,349) | 1,947 (18,115) | 2,576 (18,925) |
| swarm | 402 (4,686) | 631 (4,958) | 506 (5,153) | 682 (5,360) | 745 (5,544) | 549 (5,678) | 975 (5,929) | 892 (6,194) |
| tank | 1,634 (39,053) | 3,419 (41,313) | 3,056 (42,941) | 3,301 (66,996) | 3,946 (60,058) | 3,504 (61,511) | 3,681 (74,107) | 4,059 (69,678) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 506,636 / 759,954 / 759,954 | 2,026,544 | 5,215 / 5,727 / 6,577 | 10,245 |  |
| 2 | Mother Spore | 3 | 570,230 / 855,346 / 855,346 | 2,280,922 | 4,039 / 6,127 / 7,518 | 11,909 |  |
| 3 | The Bloatking | 3 | 636,412 / 954,618 / 954,618 | 2,545,649 | 4,884 / 6,295 / 7,668 | 9,986 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 658,275 / 987,413 / 987,413 | 2,633,101 | 5,833 / 8,170 / 9,723 | 13,559 |  |
| 5 | Foreman Ignatius | 3 | 1,008,891 / 840,743 / 840,743 | 2,690,376 | 6,629 / 9,605 / 11,195 | 19,526 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 344,697 / 1,206,441 / 1,206,441 | 2,757,580 | 6,337 / 9,624 / 10,527 | 17,815 |  |
| 7 | Archmagister Tock | 3 | 846,795 / 987,927 / 987,927 | 2,822,648 | 9,431 / 14,276 / 16,917 | 21,531 |  |
| 8 | The Landlord | 4 | 969,651 / 941,132 / 941,131 / 1,129,358 | 3,981,273 | 10,977 / 13,971 / 20,598 / 17,458 | 31,136 |  |

### NG+6

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 27,962 | 5,605–56,048 | 1,476 | 456–2,738 |  |
| 2 | 26,927 | 6,135–61,353 | 2,548 | 477–6,206 | ⚠ HP below zone 1 |
| 3 | 27,119 | 6,179–61,791 | 2,620 | 492–8,206 |  |
| 4 | 31,234 | 6,591–82,388 | 2,875 | 546–8,187 |  |
| 5 | 31,394 | 6,640–71,936 | 3,053 | 751–6,457 |  |
| 6 | 39,993 | 6,909–96,719 | 3,202 | 534–8,005 |  |
| 7 | 35,545 | 7,093–88,665 | 3,448 | 964–10,173 | ⚠ HP below zone 6 |
| 8 | 48,413 | 7,506–112,589 | 3,674 | 708–14,169 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 2,076 (21,797) | 4,511 (23,859) | 3,542 (24,030) | 4,457 (25,632) | 4,164 (25,823) | 4,358 (26,866) | 4,997 (27,585) | 3,542 (29,190) |
| brute | 2,206 (56,048) | 4,774 (61,353) | 5,881 (61,791) | 6,595 (65,910) | 4,853 (66,402) | 6,967 (96,719) | 8,388 (70,932) | 8,771 (112,589) |
| caster | 1,569 (17,126) | 2,101 (18,747) | 2,087 (18,880) | 2,877 (20,139) | 2,239 (20,290) | 2,568 (21,109) | 2,945 (21,674) | 2,227 (22,935) |
| fodder | 1,232 (18,683) | 2,041 (22,496) | 1,616 (18,537) | 2,098 (21,970) | 2,377 (24,348) | 2,301 (27,634) | 2,650 (28,373) | 2,733 (32,526) |
| hazard | 1,198 (24,910) | 1,910 (27,268) | 2,872 (35,701) | 1,819 (29,293) | 2,700 (35,415) | 3,113 (30,704) | 2,677 (31,525) | 4,048 (66,719) |
| ranged | 1,027 (15,569) | 1,671 (17,042) | 2,462 (17,164) | 2,160 (18,308) | 2,231 (18,445) | 2,001 (19,190) | 2,677 (29,555) | 2,277 (20,850) |
| support | 941 (17,126) | 1,838 (18,747) | — | 2,126 (20,139) | 4,262 (20,290) | 2,140 (21,109) | 2,209 (21,674) | 2,922 (22,935) |
| swarm | 456 (5,605) | 716 (6,135) | 574 (6,179) | 773 (6,591) | 845 (6,640) | 623 (6,909) | 1,107 (7,093) | 1,012 (7,506) |
| tank | 1,854 (46,707) | 3,879 (51,127) | 3,467 (51,492) | 3,745 (82,388) | 4,477 (71,936) | 3,975 (74,842) | 4,176 (88,665) | 4,605 (84,442) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 697,330 / 1,045,995 / 1,045,995 | 2,789,319 | 5,916 / 6,497 / 7,462 | 11,623 |  |
| 2 | Mother Spore | 3 | 775,553 / 1,163,329 / 1,163,329 | 3,102,211 | 4,582 / 6,951 / 8,529 | 13,511 |  |
| 3 | The Bloatking | 3 | 868,876 / 1,303,313 / 1,303,313 | 3,475,502 | 5,541 / 7,142 / 8,698 | 11,328 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 894,304 / 1,341,456 / 1,341,456 | 3,577,216 | 6,617 / 9,269 / 11,030 | 15,382 |  |
| 5 | Foreman Ignatius | 3 | 1,371,668 / 1,143,057 / 1,143,057 | 3,657,782 | 7,520 / 10,897 / 12,700 | 22,151 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 470,434 / 1,646,518 / 1,646,518 | 3,763,470 | 7,190 / 10,918 / 11,943 | 20,211 |  |
| 7 | Archmagister Tock | 3 | 1,152,240 / 1,344,280 / 1,344,280 | 3,840,801 | 10,699 / 16,196 / 19,192 | 24,426 |  |
| 8 | The Landlord | 4 | 1,318,028 / 1,279,263 / 1,279,262 / 1,535,115 | 5,411,668 | 12,453 / 15,850 / 23,367 / 19,805 | 35,323 |  |

### NG+7

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 33,261 | 6,667–66,670 | 1,605 | 496–2,976 |  |
| 2 | 31,208 | 7,111–71,107 | 2,770 | 519–6,746 | ⚠ HP below zone 1 |
| 3 | 32,369 | 7,375–73,753 | 2,848 | 535–8,920 |  |
| 4 | 36,200 | 7,639–95,486 | 3,125 | 593–8,899 |  |
| 5 | 37,356 | 7,901–85,598 | 3,318 | 817–7,019 |  |
| 6 | 47,345 | 8,179–114,500 | 3,481 | 580–8,701 |  |
| 7 | 42,209 | 8,423–105,289 | 3,748 | 1,048–11,058 | ⚠ HP below zone 6 |
| 8 | 56,110 | 8,699–130,489 | 3,994 | 770–15,402 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 2,257 (25,927) | 4,904 (27,653) | 3,850 (28,682) | 4,845 (29,707) | 4,526 (30,728) | 4,737 (31,806) | 5,432 (32,756) | 3,850 (33,830) |
| brute | 2,397 (66,670) | 5,189 (71,107) | 6,392 (73,753) | 7,169 (76,389) | 5,275 (79,014) | 7,573 (114,500) | 9,118 (84,231) | 9,534 (130,489) |
| caster | 1,705 (20,371) | 2,283 (21,727) | 2,269 (22,536) | 3,127 (23,341) | 2,433 (24,143) | 2,792 (24,990) | 3,201 (25,737) | 2,420 (26,581) |
| fodder | 1,339 (22,223) | 2,218 (26,073) | 1,756 (22,126) | 2,280 (25,463) | 2,584 (28,972) | 2,502 (32,714) | 2,881 (33,692) | 2,970 (37,697) |
| hazard | 1,302 (29,631) | 2,076 (31,603) | 3,122 (42,613) | 1,978 (33,951) | 2,935 (42,141) | 3,384 (36,349) | 2,910 (37,436) | 4,401 (77,327) |
| ranged | 1,116 (18,520) | 1,816 (19,752) | 2,676 (20,487) | 2,348 (21,219) | 2,425 (21,948) | 2,175 (22,718) | 2,910 (35,096) | 2,475 (24,165) |
| support | 1,023 (20,371) | 1,998 (21,727) | — | 2,311 (23,341) | 4,633 (24,143) | 2,326 (24,990) | 2,401 (25,737) | 3,177 (26,581) |
| swarm | 496 (6,667) | 778 (7,111) | 624 (7,375) | 840 (7,639) | 919 (7,901) | 677 (8,179) | 1,203 (8,423) | 1,100 (8,699) |
| tank | 2,015 (55,559) | 4,216 (59,256) | 3,769 (61,461) | 4,071 (95,486) | 4,867 (85,598) | 4,320 (88,601) | 4,540 (105,289) | 5,006 (97,867) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 922,550 / 1,383,825 / 1,383,825 | 3,690,201 | 6,431 / 7,062 / 8,111 | 12,634 |  |
| 2 | Mother Spore | 3 | 1,027,496 / 1,541,244 / 1,541,244 | 4,109,984 | 4,980 / 7,556 / 9,270 | 14,686 |  |
| 3 | The Bloatking | 3 | 1,143,175 / 1,714,763 / 1,714,763 | 4,572,702 | 6,023 / 7,763 / 9,455 | 12,314 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 1,172,759 / 1,759,138 / 1,759,138 | 4,691,035 | 7,193 / 10,075 / 11,990 | 16,720 |  |
| 5 | Foreman Ignatius | 3 | 1,792,027 / 1,493,357 / 1,493,357 | 4,778,740 | 8,174 / 11,845 / 13,805 | 24,078 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 610,860 / 2,138,008 / 2,138,008 | 4,886,876 | 7,815 / 11,867 / 12,982 | 21,969 |  |
| 7 | Archmagister Tock | 3 | 1,493,415 / 1,742,318 / 1,742,318 | 4,978,050 | 11,629 / 17,604 / 20,861 | 26,551 |  |
| 8 | The Landlord | 4 | 1,700,706 / 1,650,685 / 1,650,684 / 1,980,822 | 6,982,898 | 13,537 / 17,229 / 25,400 / 21,528 | 38,395 |  |

### NG+10

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 56,365 | 11,298–112,981 | 5,554 | 1,716–10,299 |  |
| 2 | 51,511 | 11,737–117,366 | 9,585 | 1,796–23,345 | ⚠ HP below zone 1 |
| 3 | 53,428 | 12,173–121,734 | 9,857 | 1,852–30,866 |  |
| 4 | 59,750 | 12,608–157,606 | 10,814 | 2,053–30,796 |  |
| 5 | 61,658 | 13,042–141,285 | 11,482 | 2,826–24,290 |  |
| 6 | 78,146 | 13,499–188,990 | 12,045 | 2,007–30,111 |  |
| 7 | 69,669 | 13,903–173,786 | 12,969 | 3,625–38,267 | ⚠ HP below zone 6 |
| 8 | 92,613 | 14,359–215,380 | 13,821 | 2,665–53,299 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 7,810 (43,937) | 16,970 (45,643) | 13,324 (47,341) | 16,767 (49,033) | 15,663 (50,718) | 16,394 (52,497) | 18,798 (54,067) | 13,325 (55,839) |
| brute | 8,296 (112,981) | 17,957 (117,366) | 22,121 (121,734) | 24,808 (126,084) | 18,254 (130,417) | 26,208 (188,990) | 31,554 (139,028) | 32,994 (215,380) |
| caster | 5,900 (34,522) | 7,901 (35,862) | 7,852 (37,197) | 10,821 (38,526) | 8,420 (39,850) | 9,661 (41,248) | 11,077 (42,481) | 8,376 (43,874) |
| fodder | 4,634 (37,660) | 7,677 (43,034) | 6,077 (36,520) | 7,892 (42,028) | 8,943 (47,820) | 8,657 (53,997) | 9,970 (55,611) | 10,279 (62,221) |
| hazard | 4,506 (50,214) | 7,183 (52,163) | 10,803 (70,335) | 6,844 (56,038) | 10,157 (69,556) | 11,710 (59,997) | 10,070 (61,790) | 15,228 (127,633) |
| ranged | 3,862 (31,384) | 6,285 (32,602) | 9,260 (33,815) | 8,127 (35,023) | 8,391 (36,227) | 7,528 (37,498) | 10,070 (57,929) | 8,566 (39,885) |
| support | 3,540 (34,522) | 6,914 (35,862) | — | 7,998 (38,526) | 16,031 (39,850) | 8,050 (41,248) | 8,308 (42,481) | 10,993 (43,874) |
| swarm | 1,716 (11,298) | 2,694 (11,737) | 2,161 (12,173) | 2,909 (12,608) | 3,180 (13,042) | 2,342 (13,499) | 4,162 (13,903) | 3,807 (14,359) |
| tank | 6,973 (94,151) | 14,590 (97,805) | 13,041 (101,445) | 14,086 (157,606) | 16,841 (141,285) | 14,951 (146,242) | 15,710 (173,786) | 17,322 (161,535) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 1,525,243 / 2,287,864 / 2,287,864 | 6,100,971 | 22,255 / 24,440 / 28,067 | 43,720 |  |
| 2 | Mother Spore | 3 | 1,695,946 / 2,543,919 / 2,543,919 | 6,783,784 | 17,235 / 26,147 / 32,081 | 50,821 |  |
| 3 | The Bloatking | 3 | 1,886,882 / 2,830,323 / 2,830,323 | 7,547,528 | 20,843 / 26,864 / 32,720 | 42,612 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 1,935,711 / 2,903,567 / 2,903,567 | 7,742,845 | 24,892 / 34,866 / 41,492 | 57,860 |  |
| 5 | Foreman Ignatius | 3 | 2,957,852 / 2,464,878 / 2,464,878 | 7,887,608 | 28,286 / 40,989 / 47,772 | 83,323 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 1,008,262 / 3,528,916 / 3,528,916 | 8,066,093 | 27,044 / 41,067 / 44,923 | 76,024 |  |
| 7 | Archmagister Tock | 3 | 2,464,974 / 2,875,803 / 2,875,803 | 8,216,581 | 40,244 / 60,921 / 72,192 | 91,880 |  |
| 8 | The Landlord | 4 | 2,807,121 / 2,724,558 / 2,724,557 / 3,269,470 | 11,525,707 | 46,845 / 59,620 / 87,897 / 74,497 | 132,868 |  |

## 2. Time to kill and hits to die

Each build at the zone's expected level, with points split as listed, wearing the zone's full **medium armour set at Rare (blue)** and its weapon at the zone's item level (no affixes or gems), both reinforced as far as that area allows, the weapon at the rarity assumed below. **DPS** is sustained light-attack damage per second (swing until the stamina bar is empty, then wait for it to refill); casters cast their three best damaging spells as often as cooldowns, cast time and stamina allow. **TTK** = seconds of that DPS to kill the zone's average room enemy / its boss (all phases). **Hits** = average hits of the zone's room enemies / the boss's biggest hit to kill the build, after its defense.

| Cycle | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First playthrough | L6 · ilvl 1 · uncommon +0 | L15 · ilvl 2 · uncommon +0 | L26 · ilvl 3 · rare +0 | L37 · ilvl 4 · rare +1 | L47 · ilvl 5 · rare +2 | L57 · ilvl 6 · epic +3 | L67 · ilvl 7 · epic +3 | L76 · ilvl 8 · epic +3 |
| NG+1 | L84 · ilvl 9 · epic +4 | L90 · ilvl 10 · epic +5 | L96 · ilvl 11 · epic +6 | L105 · ilvl 12 · epic +6 | L117 · ilvl 13 · epic +6 | L127 · ilvl 14 · epic +6 | L134 · ilvl 15 · epic +6 | L142 · ilvl 16 · epic +6 |
| NG+2 | L149 · ilvl 17 · epic +7 | L155 · ilvl 18 · epic +8 | L162 · ilvl 19 · epic +9 | L171 · ilvl 20 · epic +9 | L184 · ilvl 21 · epic +9 | L194 · ilvl 22 · epic +9 | L202 · ilvl 23 · epic +9 | L210 · ilvl 24 · epic +9 |
| NG+3 | L217 · ilvl 25 · epic +10 | L225 · ilvl 26 · epic +11 | L232 · ilvl 27 · epic +12 | L242 · ilvl 28 · epic +12 | L255 · ilvl 29 · epic +12 | L266 · ilvl 30 · epic +12 | L275 · ilvl 31 · epic +12 | L283 · ilvl 32 · epic +12 |
| NG+4 | L291 · ilvl 33 · epic +13 | L299 · ilvl 34 · epic +14 | L306 · ilvl 35 · epic +15 | L317 · ilvl 36 · epic +15 | L332 · ilvl 37 · epic +15 | L343 · ilvl 38 · epic +15 | L352 · ilvl 39 · epic +15 | L360 · ilvl 40 · epic +15 |
| NG+5 | L369 · ilvl 41 · epic +15 | L377 · ilvl 42 · epic +15 | L385 · ilvl 43 · epic +15 | L396 · ilvl 44 · epic +15 | L411 · ilvl 45 · epic +15 | L424 · ilvl 46 · epic +15 | L433 · ilvl 47 · epic +15 | L443 · ilvl 48 · epic +15 |
| NG+6 | L452 · ilvl 49 · epic +15 | L461 · ilvl 50 · epic +15 | L470 · ilvl 51 · epic +15 | L482 · ilvl 52 · epic +15 | L499 · ilvl 53 · epic +15 | L512 · ilvl 54 · epic +15 | L522 · ilvl 55 · epic +15 | L532 · ilvl 56 · epic +15 |
| NG+7 | L541 · ilvl 57 · epic +15 | L551 · ilvl 58 · epic +15 | L560 · ilvl 59 · epic +15 | L572 · ilvl 60 · epic +15 | L589 · ilvl 61 · epic +15 | L603 · ilvl 62 · epic +15 | L614 · ilvl 63 · epic +15 | L624 · ilvl 64 · epic +15 |
| NG+10 | L839 · ilvl 81 · epic +15 | L850 · ilvl 82 · epic +15 | L861 · ilvl 83 · epic +15 | L876 · ilvl 84 · epic +15 | L896 · ilvl 85 · epic +15 | L912 · ilvl 86 · epic +15 | L924 · ilvl 87 · epic +15 | L937 · ilvl 88 · epic +15 |

### First playthrough

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 33 dps · 2.7s / 77s · 17.7 / 3.7 hits | 53 dps · 2.3s / 106s · 23.2 / 3.1 hits | 80 dps · 2.1s / 95s · 19.4 / 3.9 hits | 123 dps · 1.8s / 85s · 17.8 / 3.2 hits | 194 dps · 1.3s / 88s · 15.4 / 2.2 hits | 310 dps · 1.1s / 61s · 16.6 / 2.8 hits | 400 dps · 0.9s / 53s · 17.6 / 3 hits | 508 dps · 1s / 111s · 18.2 / 1.4 hits |
| Slicey: twin daggers | 33 dps · 2.7s / 77s · 13 / 2.7 hits | 53 dps · 2.3s / 106s · 17.4 / 2.4 hits | 82 dps · 2s / 93s · 14.8 / 3 hits | 128 dps · 1.7s / 82s · 13.8 / 2.5 hits | 185 dps · 1.4s / 93s · 12.1 / 1.7 hits | 274 dps · 1.3s / 69s · 13.2 / 2.2 hits | 331 dps · 1.1s / 64s · 14.2 / 2.4 hits | 399 dps · 1.3s / 141s · 15.2 / 1.1 hits |
| Quality: longsword + shield | 44 dps · 2s / 57s · 16.8 / 3.5 hits | 69 dps · 1.8s / 81s · 22.4 / 3 hits | 103 dps · 1.6s / 73s · 19 / 3.8 hits | 158 dps · 1.4s / 67s · 17.7 / 3.2 hits | 226 dps · 1.1s / 76s · 15.5 / 2.2 hits | 330 dps · 1.1s / 57s · 16.7 / 2.8 hits | 394 dps · 0.9s / 53s · 18 / 3 hits | 462 dps · 1.1s / 122s · 18.9 / 1.4 hits |
| Bow (Slicey) | 28 dps · 3.2s / 89s · 12.2 / 2.5 hits | 44 dps · 2.8s / 127s · 16.5 / 2.2 hits | 65 dps · 2.6s / 117s · 14.1 / 2.8 hits | 98 dps · 2.2s / 107s · 13.3 / 2.4 hits | 139 dps · 1.8s / 123s · 11.7 / 1.7 hits | 205 dps · 1.7s / 92s · 12.7 / 2.1 hits | 243 dps · 1.4s / 87s · 13.8 / 2.3 hits | 287 dps · 1.8s / 196s · 14.8 / 1.1 hits |
| Crossbow (Bonk) | 17 dps · 5.1s / 144s · 17.7 / 3.7 hits | 27 dps · 4.5s / 205s · 23.2 / 3.1 hits | 40 dps · 4.1s / 188s · 19.4 / 3.9 hits | 61 dps · 3.6s / 172s · 17.8 / 3.2 hits | 89 dps · 2.8s / 192s · 15.4 / 2.2 hits | 129 dps · 2.7s / 146s · 16.6 / 2.8 hits | 153 dps · 2.3s / 137s · 17.6 / 3 hits | 181 dps · 2.9s / 311s · 18.2 / 1.4 hits |
| Brain caster: staff spells | 35 dps · 2.6s / 72s · 12.2 / 2.5 hits | 63 dps · 1.9s / 88s · 16.5 / 2.2 hits | 96 dps · 1.7s / 79s · 14.1 / 2.8 hits | 139 dps · 1.6s / 76s · 13.3 / 2.4 hits | 191 dps · 1.3s / 90s · 11.7 / 1.7 hits | 268 dps · 1.3s / 70s · 12.7 / 2.1 hits | 319 dps · 1.1s / 66s · 13.8 / 2.3 hits | 375 dps · 1.4s / 151s · 14.8 / 1.1 hits |
| Brain caster: S staff (Archmagister's Rod) | 53 dps · 1.7s / 48s · 12.2 / 2.5 hits ⚠req | 70 dps · 1.7s / 79s · 16.5 / 2.2 hits ⚠req | 122 dps · 1.4s / 62s · 14.1 / 2.8 hits | 179 dps · 1.2s / 59s · 13.3 / 2.4 hits | 249 dps · 1s / 69s · 11.7 / 1.7 hits | 353 dps · 1s / 53s · 12.7 / 2.1 hits | 428 dps · 0.8s / 49s · 13.8 / 2.3 hits | 509 dps · 1s / 111s · 14.8 / 1.1 hits |
| Prayer caster: talisman spells | 33 dps · 2.7s / 75s · 13 / 2.7 hits | 31 dps · 3.9s / 178s · 17.4 / 2.4 hits | 46 dps · 3.6s / 166s · 14.8 / 3 hits | 68 dps · 3.2s / 154s · 13.8 / 2.5 hits | 95 dps · 2.7s / 180s · 12.1 / 1.7 hits | 136 dps · 2.6s / 138s · 13.2 / 2.2 hits | 163 dps · 2.2s / 129s · 14.2 / 2.4 hits | 195 dps · 2.7s / 289s · 15.2 / 1.1 hits |

- Brain caster: staff spells: Z1 Void Rift, Frost Lance, Chain Lightning; spells 29 + weapon 6 · Z2 Void Rift, Arcane Beam, Frost Lance; spells 61 + weapon 3 · Z3 Meteor, Void Rift, Arcane Beam; spells 90 + weapon 6 · Z4 Meteor, Void Rift, Arcane Beam; spells 130 + weapon 9 · Z5 Meteor, Void Rift, Arcane Beam; spells 178 + weapon 12 · Z6 Meteor, Void Rift, Arcane Beam; spells 251 + weapon 17 · Z7 Meteor, Void Rift, Arcane Beam; spells 299 + weapon 20 · Z8 Meteor, Void Rift, Arcane Beam; spells 351 + weapon 24
- Brain caster: S staff (Archmagister's Rod): Z1 Void Rift, Frost Lance, Chain Lightning; spells 47 + weapon 6 · Z2 Void Rift, Frost Lance, Chain Lightning; spells 67 + weapon 4 · Z3 Meteor, Void Rift, Frost Lance; spells 116 + weapon 6 · Z4 Meteor, Void Rift, Frost Lance; spells 170 + weapon 9 · Z5 Meteor, Void Rift, Frost Lance; spells 236 + weapon 13 · Z6 Meteor, Void Rift, Frost Lance; spells 335 + weapon 18 · Z7 Meteor, Void Rift, Frost Lance; spells 407 + weapon 21 · Z8 Meteor, Void Rift, Frost Lance; spells 485 + weapon 25
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 13 + weapon 20 · Z2 Sunray, Purify; spells 19 + weapon 12 · Z3 Sunray, Purify; spells 27 + weapon 18 · Z4 Sunray, Purify; spells 40 + weapon 28 · Z5 Sunray, Purify; spells 55 + weapon 40 · Z6 Sunray, Purify; spells 78 + weapon 58 · Z7 Sunray, Purify; spells 93 + weapon 70 · Z8 Sunray, Purify; spells 111 + weapon 84

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 76 | 48 | 144 | 3 |
| 2 | 106 | 79 | 205 | 2.6 |
| 3 | 94 | 62 | 188 | 3 |
| 4 | 84 | 59 | 172 | 2.9 |
| 5 | 91 | 69 | 192 | 2.8 |
| 6 | 69 | 53 | 146 | 2.7 |
| 7 | 65 | 49 | 137 | 2.8 |
| 8 | 146 | 111 | 311 | 2.8 |

### NG+1

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 687 dps · 1.1s / 86s · 18.2 / 2 hits | 874 dps · 1.1s / 86s · 15.3 / 1.8 hits | 1,078 dps · 1.4s / 92s · 17.9 / 3 hits | 1,268 dps · 1.5s / 90s · 16.2 / 2.4 hits | 1,475 dps · 1.4s / 76s · 13.8 / 1.5 hits | 1,677 dps · 1.6s / 75s · 15.4 / 1.7 hits | 1,868 dps · 1.3s / 75s · 18.6 / 2.1 hits | 2,057 dps · 1.7s / 124s · 14.9 / 1 hits |
| Slicey: twin daggers | 546 dps · 1.4s / 109s · 15.3 / 1.7 hits | 702 dps · 1.4s / 107s · 12.8 / 1.5 hits | 870 dps · 1.7s / 114s · 15 / 2.5 hits | 1,034 dps · 1.9s / 110s · 13.6 / 2 hits | 1,246 dps · 1.7s / 89s · 11.6 / 1.2 hits | 1,449 dps · 1.9s / 87s · 13 / 1.5 hits | 1,645 dps · 1.5s / 85s · 15.7 / 1.8 hits | 1,832 dps · 1.9s / 139s · 12.3 / 0.9 hits ⚠1-shot |
| Quality: longsword + shield | 586 dps · 1.3s / 101s · 18.9 / 2.1 hits | 720 dps · 1.4s / 105s · 15.9 / 1.9 hits | 874 dps · 1.7s / 114s · 18.6 / 3.1 hits | 977 dps · 2s / 117s · 16.9 / 2.5 hits | 1,096 dps · 1.9s / 102s · 14.5 / 1.5 hits | 1,211 dps · 2.3s / 104s · 16.1 / 1.8 hits | 1,319 dps · 1.9s / 107s · 19.4 / 2.2 hits | 1,436 dps · 2.4s / 177s · 15.5 / 1.1 hits |
| Bow (Slicey) | 382 dps · 2s / 156s · 15 / 1.7 hits | 481 dps · 2s / 156s · 12.7 / 1.5 hits | 590 dps · 2.6s / 169s · 14.8 / 2.5 hits | 686 dps · 2.8s / 166s · 13.4 / 2 hits | 816 dps · 2.5s / 137s · 11.5 / 1.2 hits | 934 dps · 2.9s / 135s · 12.8 / 1.5 hits | 1,045 dps · 2.4s / 135s · 15.5 / 1.8 hits | 1,154 dps · 3s / 221s · 12.2 / 0.9 hits ⚠1-shot |
| Crossbow (Bonk) | 241 dps · 3.2s / 246s · 18.2 / 2 hits | 304 dps · 3.2s / 248s · 15.3 / 1.8 hits | 373 dps · 4.1s / 267s · 17.9 / 3 hits | 442 dps · 4.3s / 258s · 16.2 / 2.4 hits | 519 dps · 4s / 215s · 13.8 / 1.5 hits | 594 dps · 4.6s / 212s · 15.4 / 1.7 hits | 665 dps · 3.7s / 211s · 18.6 / 2.1 hits | 734 dps · 4.7s / 347s · 14.9 / 1 hits |
| Brain caster: staff spells | 483 dps · 1.6s / 123s · 15 / 1.7 hits | 597 dps · 1.7s / 126s · 12.7 / 1.5 hits | 727 dps · 2.1s / 137s · 14.8 / 2.5 hits | 826 dps · 2.3s / 138s · 13.4 / 2 hits | 950 dps · 2.2s / 117s · 11.5 / 1.2 hits | 1,071 dps · 2.6s / 118s · 12.8 / 1.5 hits | 1,180 dps · 2.1s / 119s · 15.5 / 1.8 hits | 1,284 dps · 2.7s / 198s · 12.2 / 0.9 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 669 dps · 1.2s / 89s · 15 / 1.7 hits | 834 dps · 1.2s / 90s · 12.7 / 1.5 hits | 1,025 dps · 1.5s / 97s · 14.8 / 2.5 hits | 1,179 dps · 1.6s / 97s · 13.4 / 2 hits | 1,378 dps · 1.5s / 81s · 11.5 / 1.2 hits | 1,573 dps · 1.7s / 80s · 12.8 / 1.5 hits | 1,746 dps · 1.4s / 81s · 15.5 / 1.8 hits | 1,909 dps · 1.8s / 133s · 12.2 / 0.9 hits ⚠1-shot |
| Prayer caster: talisman spells | 258 dps · 3s / 230s · 15.3 / 1.7 hits | 323 dps · 3.1s / 233s · 12.8 / 1.5 hits | 397 dps · 3.8s / 250s · 15 / 2.5 hits | 458 dps · 4.2s / 249s · 13.6 / 2 hits | 536 dps · 3.9s / 208s · 11.6 / 1.2 hits | 612 dps · 4.5s / 206s · 13 / 1.5 hits | 681 dps · 3.6s / 206s · 15.7 / 1.8 hits | 751 dps · 4.6s / 339s · 12.3 / 0.9 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 454 + weapon 29 · Z2 Meteor, Void Rift, Arcane Beam; spells 562 + weapon 36 · Z3 Meteor, Void Rift, Arcane Beam; spells 684 + weapon 43 · Z4 Meteor, Void Rift, Arcane Beam; spells 779 + weapon 47 · Z5 Meteor, Void Rift, Arcane Beam; spells 897 + weapon 52 · Z6 Meteor, Void Rift, Arcane Beam; spells 1,014 + weapon 57 · Z7 Meteor, Void Rift, Arcane Beam; spells 1,119 + weapon 61 · Z8 Meteor, Void Rift, Arcane Beam; spells 1,217 + weapon 67
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 638 + weapon 31 · Z2 Meteor, Void Rift, Frost Lance; spells 797 + weapon 38 · Z3 Meteor, Void Rift, Frost Lance; spells 980 + weapon 45 · Z4 Meteor, Void Rift, Frost Lance; spells 1,130 + weapon 50 · Z5 Meteor, Void Rift, Frost Lance; spells 1,322 + weapon 56 · Z6 Meteor, Void Rift, Frost Lance; spells 1,513 + weapon 60 · Z7 Meteor, Void Rift, Frost Lance; spells 1,680 + weapon 65 · Z8 Meteor, Void Rift, Frost Lance; spells 1,837 + weapon 72
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 145 + weapon 113 · Z2 Sunray, Purify; spells 181 + weapon 142 · Z3 Sunray, Purify; spells 222 + weapon 175 · Z4 Sunray, Purify; spells 256 + weapon 202 · Z5 Sunray, Purify; spells 298 + weapon 238 · Z6 Sunray, Purify; spells 340 + weapon 272 · Z7 Sunray, Purify; spells 377 + weapon 303 · Z8 Sunray, Purify; spells 412 + weapon 339

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 116 | 86 | 246 | 2.9 |
| 2 | 117 | 86 | 248 | 2.9 |
| 3 | 126 | 92 | 267 | 2.9 |
| 4 | 127 | 90 | 258 | 2.9 |
| 5 | 109 | 76 | 215 | 2.8 |
| 6 | 111 | 75 | 212 | 2.8 |
| 7 | 113 | 75 | 211 | 2.8 |
| 8 | 188 | 124 | 347 | 2.8 |

### NG+2

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 2,448 dps · 1.9s / 123s · 19.5 / 2.2 hits | 2,858 dps · 1.8s / 124s · 16.1 / 2.2 hits | 3,377 dps · 1.8s / 123s · 17.8 / 3 hits | 3,693 dps · 1.9s / 121s · 15.3 / 2.3 hits | 3,892 dps · 1.9s / 126s · 12.6 / 1.3 hits | 4,093 dps · 2.5s / 129s · 13.6 / 1.5 hits | 4,296 dps · 2.2s / 129s · 16.1 / 1.8 hits | 4,488 dps · 2.9s / 178s · 11.9 / 0.8 hits ⚠1-shot |
| Slicey: twin daggers | 2,210 dps · 2.1s / 137s · 16.2 / 1.8 hits | 2,605 dps · 2s / 136s · 13.4 / 1.8 hits | 3,065 dps · 1.9s / 136s · 14.9 / 2.5 hits | 3,391 dps · 2s / 132s · 12.7 / 1.9 hits | 3,577 dps · 2.1s / 137s · 10.5 / 1.1 hits | 3,765 dps · 2.7s / 140s · 11.4 / 1.3 hits | 3,967 dps · 2.4s / 140s · 13.5 / 1.5 hits | 4,146 dps · 3.1s / 193s · 10 / 0.7 hits ⚠1-shot |
| Quality: longsword + shield | 1,673 dps · 2.8s / 180s · 20.3 / 2.3 hits | 1,955 dps · 2.7s / 181s · 16.8 / 2.3 hits | 2,255 dps · 2.6s / 185s · 18.6 / 3.1 hits | 2,473 dps · 2.8s / 181s · 16 / 2.4 hits | 2,850 dps · 2.7s / 172s · 12.8 / 1.4 hits | 3,150 dps · 3.2s / 168s · 13.9 / 1.6 hits | 3,403 dps · 2.8s / 163s · 16.7 / 1.9 hits | 3,721 dps · 3.5s / 215s · 12.3 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 1,378 dps · 3.4s / 219s · 15.9 / 1.8 hits | 1,614 dps · 3.3s / 220s · 13.2 / 1.8 hits | 1,879 dps · 3.2s / 221s · 14.6 / 2.4 hits | 2,062 dps · 3.4s / 218s · 12.6 / 1.9 hits | 2,172 dps · 3.5s / 225s · 10.4 / 1.1 hits | 2,303 dps · 4.4s / 230s · 11.2 / 1.3 hits | 2,416 dps · 3.9s / 230s · 13.3 / 1.5 hits | 2,523 dps · 5.1s / 317s · 9.9 / 0.7 hits ⚠1-shot |
| Crossbow (Bonk) | 878 dps · 5.4s / 344s · 19.5 / 2.2 hits | 1,028 dps · 5.1s / 345s · 16.1 / 2.2 hits | 1,197 dps · 5s / 348s · 17.8 / 3 hits | 1,314 dps · 5.3s / 341s · 15.3 / 2.3 hits | 1,385 dps · 5.5s / 353s · 12.6 / 1.3 hits | 1,474 dps · 6.8s / 359s · 13.6 / 1.5 hits | 1,547 dps · 6.1s / 360s · 16.1 / 1.8 hits | 1,615 dps · 8s / 495s · 11.9 / 0.8 hits ⚠1-shot |
| Brain caster: staff spells | 1,513 dps · 3.1s / 199s · 15.9 / 1.8 hits | 1,739 dps · 3s / 204s · 13.4 / 1.8 hits | 1,952 dps · 3.1s / 213s · 14.9 / 2.5 hits | 2,047 dps · 3.4s / 219s · 12.7 / 1.9 hits | 2,144 dps · 3.5s / 228s · 10.4 / 1.1 hits | 2,239 dps · 4.5s / 236s · 11.2 / 1.3 hits | 2,336 dps · 4s / 238s · 13.3 / 1.5 hits | 2,433 dps · 5.3s / 328s · 9.9 / 0.7 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 2,264 dps · 2.1s / 133s · 15.9 / 1.8 hits | 2,608 dps · 2s / 136s · 13.4 / 1.8 hits | 2,928 dps · 2s / 142s · 14.9 / 2.5 hits | 3,070 dps · 2.3s / 146s · 12.7 / 1.9 hits | 3,214 dps · 2.4s / 152s · 10.4 / 1.1 hits | 3,357 dps · 3s / 157s · 11.2 / 1.3 hits | 3,501 dps · 2.7s / 159s · 13.3 / 1.5 hits | 3,645 dps · 3.5s / 219s · 9.9 / 0.7 hits ⚠1-shot |
| Prayer caster: talisman spells | 892 dps · 5.3s / 338s · 16.2 / 1.8 hits | 1,040 dps · 5.1s / 341s · 13.4 / 1.8 hits | 1,171 dps · 5.1s / 355s · 15.1 / 2.5 hits | 1,231 dps · 5.6s / 364s · 12.9 / 2 hits | 1,295 dps · 5.8s / 378s · 10.5 / 1.1 hits | 1,355 dps · 7.4s / 390s · 11.4 / 1.3 hits | 1,420 dps · 6.6s / 392s · 13.5 / 1.5 hits | 1,481 dps · 8.7s / 539s · 10 / 0.7 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 1,435 + weapon 78 · Z2 Meteor, Void Rift, Arcane Beam; spells 1,649 + weapon 89 · Z3 Meteor, Void Rift, Arcane Beam; spells 1,850 + weapon 102 · Z4 Meteor, Void Rift, Arcane Beam; spells 1,939 + weapon 108 · Z5 Meteor, Void Rift, Arcane Beam; spells 2,028 + weapon 116 · Z6 Meteor, Void Rift, Arcane Beam; spells 2,117 + weapon 122 · Z7 Meteor, Void Rift, Arcane Beam; spells 2,206 + weapon 131 · Z8 Meteor, Void Rift, Arcane Beam; spells 2,294 + weapon 138
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 2,180 + weapon 83 · Z2 Meteor, Void Rift, Frost Lance; spells 2,513 + weapon 96 · Z3 Meteor, Void Rift, Frost Lance; spells 2,819 + weapon 109 · Z4 Meteor, Void Rift, Frost Lance; spells 2,954 + weapon 116 · Z5 Meteor, Void Rift, Frost Lance; spells 3,090 + weapon 125 · Z6 Meteor, Void Rift, Frost Lance; spells 3,225 + weapon 132 · Z7 Meteor, Void Rift, Frost Lance; spells 3,360 + weapon 141 · Z8 Meteor, Void Rift, Frost Lance; spells 3,495 + weapon 150
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 489 + weapon 404 · Z2 Sunray, Purify; spells 568 + weapon 472 · Z3 Sunray, Purify; spells 637 + weapon 533 · Z4 Sunray, Purify; spells 668 + weapon 563 · Z5 Sunray, Purify; spells 698 + weapon 596 · Z6 Sunray, Purify; spells 729 + weapon 626 · Z7 Sunray, Purify; spells 760 + weapon 660 · Z8 Sunray, Purify; spells 790 + weapon 691

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 190 | 123 | 344 | 2.8 |
| 2 | 193 | 124 | 345 | 2.8 |
| 3 | 199 | 123 | 355 | 2.9 |
| 4 | 199 | 121 | 364 | 3 |
| 5 | 198 | 126 | 378 | 3 |
| 6 | 199 | 129 | 390 | 3 |
| 7 | 197 | 129 | 392 | 3 |
| 8 | 268 | 178 | 539 | 3 |

### NG+3

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 4,994 dps · 2.5s / 161s · 23.8 / 2.7 hits | 5,512 dps · 2s / 161s · 18.9 / 2.6 hits | 6,073 dps · 1.9s / 162s · 19.9 / 3.3 hits | 6,326 dps · 2s / 158s · 16.7 / 2.6 hits | 6,580 dps · 2s / 154s · 13 / 1.4 hits | 6,856 dps · 2.5s / 151s · 13.6 / 1.5 hits | 7,095 dps · 2.1s / 149s · 15.5 / 1.8 hits | 7,355 dps · 2.7s / 201s · 11 / 0.8 hits ⚠1-shot |
| Slicey: twin daggers | 4,617 dps · 2.7s / 175s · 20 / 2.3 hits | 5,099 dps · 2.2s / 174s · 15.9 / 2.2 hits | 5,639 dps · 2s / 174s · 16.8 / 2.8 hits | 5,878 dps · 2.2s / 170s · 14.1 / 2.2 hits | 6,119 dps · 2.2s / 166s · 11 / 1.2 hits | 6,400 dps · 2.6s / 162s · 11.5 / 1.3 hits | 6,626 dps · 2.3s / 159s · 13.1 / 1.5 hits | 6,875 dps · 2.9s / 215s · 9.3 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 4,253 dps · 2.9s / 190s · 24.7 / 2.8 hits | 4,859 dps · 2.3s / 182s · 19.7 / 2.7 hits | 5,510 dps · 2.1s / 178s · 20.8 / 3.5 hits | 5,975 dps · 2.1s / 167s · 17.5 / 2.7 hits | 6,560 dps · 2s / 155s · 13.6 / 1.4 hits | 7,092 dps · 2.4s / 146s · 14.2 / 1.6 hits | 7,605 dps · 2s / 139s · 16.3 / 1.9 hits | 8,104 dps · 2.5s / 183s · 11.5 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 2,806 dps · 4.4s / 287s · 19.7 / 2.2 hits | 3,096 dps · 3.5s / 286s · 15.7 / 2.1 hits | 3,411 dps · 3.4s / 288s · 16.6 / 2.8 hits | 3,550 dps · 3.6s / 281s · 13.9 / 2.1 hits | 3,692 dps · 3.6s / 275s · 10.8 / 1.1 hits | 3,844 dps · 4.4s / 270s · 11.4 / 1.3 hits | 3,977 dps · 3.8s / 265s · 13 / 1.5 hits | 4,121 dps · 4.9s / 359s · 9.2 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 1,797 dps · 6.9s / 449s · 23.8 / 2.7 hits | 1,984 dps · 5.5s / 446s · 18.9 / 2.6 hits | 2,186 dps · 5.3s / 449s · 19.9 / 3.3 hits | 2,277 dps · 5.6s / 439s · 16.7 / 2.6 hits | 2,368 dps · 5.7s / 429s · 13 / 1.4 hits | 2,467 dps · 6.8s / 421s · 13.6 / 1.5 hits | 2,553 dps · 6s / 414s · 15.5 / 1.8 hits | 2,647 dps · 7.6s / 559s · 11 / 0.8 hits ⚠1-shot |
| Brain caster: staff spells | 2,690 dps · 4.6s / 300s · 20 / 2.3 hits | 2,959 dps · 3.7s / 299s · 15.7 / 2.1 hits | 3,241 dps · 3.6s / 303s · 16.6 / 2.8 hits | 3,358 dps · 3.8s / 298s · 13.9 / 2.1 hits | 3,474 dps · 3.9s / 293s · 10.8 / 1.1 hits | 3,589 dps · 4.7s / 289s · 11.5 / 1.3 hits | 3,708 dps · 4.1s / 285s · 13 / 1.5 hits | 3,823 dps · 5.3s / 387s · 9.2 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 4,030 dps · 3.1s / 200s · 20 / 2.3 hits | 4,433 dps · 2.5s / 200s · 15.7 / 2.1 hits | 4,854 dps · 2.4s / 202s · 16.6 / 2.8 hits | 5,028 dps · 2.5s / 199s · 13.9 / 2.1 hits | 5,201 dps · 2.6s / 195s · 10.8 / 1.1 hits | 5,373 dps · 3.1s / 193s · 11.5 / 1.3 hits | 5,548 dps · 2.7s / 190s · 13 / 1.5 hits | 5,720 dps · 3.5s / 259s · 9.2 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 1,648 dps · 7.5s / 489s · 20.2 / 2.3 hits | 1,817 dps · 6s / 487s · 15.9 / 2.2 hits | 1,994 dps · 5.8s / 492s · 16.8 / 2.8 hits | 2,074 dps · 6.1s / 482s · 14.1 / 2.2 hits | 2,155 dps · 6.2s / 472s · 11 / 1.2 hits | 2,230 dps · 7.6s / 465s · 11.6 / 1.3 hits | 2,312 dps · 6.6s / 457s · 13.1 / 1.5 hits | 2,388 dps · 8.4s / 619s · 9.3 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 2,535 + weapon 155 · Z2 Meteor, Void Rift, Arcane Beam; spells 2,787 + weapon 172 · Z3 Meteor, Void Rift, Arcane Beam; spells 3,051 + weapon 190 · Z4 Meteor, Void Rift, Arcane Beam; spells 3,156 + weapon 201 · Z5 Meteor, Void Rift, Arcane Beam; spells 3,262 + weapon 212 · Z6 Meteor, Void Rift, Arcane Beam; spells 3,368 + weapon 221 · Z7 Meteor, Void Rift, Arcane Beam; spells 3,473 + weapon 234 · Z8 Meteor, Void Rift, Arcane Beam; spells 3,579 + weapon 244
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 3,862 + weapon 168 · Z2 Meteor, Void Rift, Frost Lance; spells 4,246 + weapon 187 · Z3 Meteor, Void Rift, Frost Lance; spells 4,647 + weapon 207 · Z4 Meteor, Void Rift, Frost Lance; spells 4,809 + weapon 219 · Z5 Meteor, Void Rift, Frost Lance; spells 4,970 + weapon 232 · Z6 Meteor, Void Rift, Frost Lance; spells 5,131 + weapon 242 · Z7 Meteor, Void Rift, Frost Lance; spells 5,292 + weapon 256 · Z8 Meteor, Void Rift, Frost Lance; spells 5,453 + weapon 267
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 873 + weapon 775 · Z2 Sunray, Purify; spells 960 + weapon 857 · Z3 Sunray, Purify; spells 1,051 + weapon 944 · Z4 Sunray, Purify; spells 1,087 + weapon 987 · Z5 Sunray, Purify; spells 1,123 + weapon 1,031 · Z6 Sunray, Purify; spells 1,160 + weapon 1,071 · Z7 Sunray, Purify; spells 1,196 + weapon 1,116 · Z8 Sunray, Purify; spells 1,233 + weapon 1,156

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 244 | 161 | 489 | 3 |
| 2 | 243 | 161 | 487 | 3 |
| 3 | 245 | 162 | 492 | 3 |
| 4 | 240 | 158 | 482 | 3 |
| 5 | 235 | 154 | 472 | 3.1 |
| 6 | 232 | 146 | 465 | 3.2 |
| 7 | 228 | 139 | 457 | 3.3 |
| 8 | 309 | 183 | 619 | 3.4 |

### NG+4

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 8,026 dps · 2.4s / 180s · 26.4 / 3 hits | 8,727 dps · 2s / 183s · 19.9 / 2.7 hits | 9,565 dps · 1.9s / 185s · 20.3 / 3.4 hits | 9,881 dps · 2s / 185s · 16.3 / 2.5 hits | 10,226 dps · 2s / 182s · 12 / 1.3 hits | 10,546 dps · 2.5s / 182s · 12.3 / 1.4 hits | 10,870 dps · 2.2s / 181s · 13.8 / 1.6 hits | 11,195 dps · 2.9s / 247s · 9.7 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 7,508 dps · 2.6s / 192s · 22.3 / 2.5 hits | 8,145 dps · 2.1s / 196s · 17.3 / 2.4 hits | 8,862 dps · 2s / 199s · 17.8 / 3 hits | 9,160 dps · 2.2s / 199s · 14.3 / 2.2 hits | 9,512 dps · 2.2s / 196s · 10.6 / 1.1 hits | 9,817 dps · 2.7s / 195s · 10.8 / 1.2 hits | 10,124 dps · 2.3s / 194s · 12.1 / 1.4 hits | 10,434 dps · 3.1s / 265s · 8.5 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 9,023 dps · 2.1s / 160s · 28 / 3.2 hits | 10,111 dps · 1.7s / 158s · 21.5 / 3 hits | 11,206 dps · 1.6s / 158s · 21.9 / 3.7 hits | 12,014 dps · 1.7s / 152s · 17.6 / 2.7 hits | 12,962 dps · 1.6s / 144s · 13 / 1.4 hits | 13,836 dps · 1.9s / 138s · 13.3 / 1.5 hits | 14,580 dps · 1.6s / 135s · 14.9 / 1.7 hits | 15,134 dps · 2.1s / 183s · 10.5 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 4,495 dps · 4.3s / 321s · 22.1 / 2.5 hits | 4,874 dps · 3.5s / 328s · 17.2 / 2.4 hits | 5,317 dps · 3.3s / 332s · 17.8 / 3 hits | 5,503 dps · 3.6s / 331s · 14.3 / 2.2 hits | 5,691 dps · 3.6s / 327s · 10.6 / 1.1 hits | 5,867 dps · 4.6s / 327s · 10.8 / 1.2 hits | 6,044 dps · 3.9s / 325s · 12.1 / 1.4 hits | 6,222 dps · 5.1s / 445s · 8.5 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 2,888 dps · 6.7s / 500s · 26.4 / 3 hits | 3,140 dps · 5.5s / 510s · 19.9 / 2.7 hits | 3,403 dps · 5.2s / 519s · 20.3 / 3.4 hits | 3,515 dps · 5.7s / 519s · 16.3 / 2.5 hits | 3,637 dps · 5.7s / 512s · 12 / 1.3 hits | 3,784 dps · 7.1s / 506s · 12.3 / 1.4 hits | 3,899 dps · 6s / 504s · 13.8 / 1.6 hits | 4,016 dps · 7.9s / 690s · 9.7 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 4,149 dps · 4.7s / 348s · 22.3 / 2.5 hits | 4,488 dps · 3.9s / 356s · 17.3 / 2.4 hits | 4,842 dps · 3.7s / 365s · 17.8 / 3 hits | 4,983 dps · 4s / 366s · 14.3 / 2.2 hits | 5,119 dps · 4s / 364s · 10.6 / 1.1 hits | 5,257 dps · 5.1s / 364s · 10.8 / 1.2 hits | 5,392 dps · 4.4s / 364s · 12.1 / 1.4 hits | 5,530 dps · 5.8s / 501s · 8.5 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 6,207 dps · 3.1s / 233s · 22.3 / 2.5 hits | 6,713 dps · 2.6s / 238s · 17.3 / 2.4 hits | 7,242 dps · 2.5s / 244s · 17.8 / 3 hits | 7,449 dps · 2.7s / 245s · 14.3 / 2.2 hits | 7,651 dps · 2.7s / 243s · 10.6 / 1.1 hits | 7,855 dps · 3.4s / 244s · 10.8 / 1.2 hits | 8,056 dps · 2.9s / 244s · 12.1 / 1.4 hits | 8,261 dps · 3.9s / 335s · 8.5 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 2,597 dps · 7.4s / 556s · 22.5 / 2.6 hits | 2,815 dps · 6.1s / 568s · 17.5 / 2.4 hits | 3,064 dps · 5.8s / 577s · 17.8 / 3 hits | 3,162 dps · 6.3s / 577s · 14.3 / 2.2 hits | 3,253 dps · 6.4s / 572s · 10.6 / 1.1 hits | 3,352 dps · 8s / 571s · 10.8 / 1.2 hits | 3,444 dps · 6.8s / 570s · 12.1 / 1.4 hits | 3,544 dps · 9s / 781s · 8.5 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 3,882 + weapon 267 · Z2 Meteor, Void Rift, Arcane Beam; spells 4,197 + weapon 291 · Z3 Meteor, Void Rift, Arcane Beam; spells 4,523 + weapon 320 · Z4 Meteor, Void Rift, Arcane Beam; spells 4,645 + weapon 337 · Z5 Meteor, Void Rift, Arcane Beam; spells 4,768 + weapon 351 · Z6 Meteor, Void Rift, Arcane Beam; spells 4,891 + weapon 366 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,014 + weapon 379 · Z8 Meteor, Void Rift, Arcane Beam; spells 5,136 + weapon 394
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 5,915 + weapon 293 · Z2 Meteor, Void Rift, Frost Lance; spells 6,394 + weapon 320 · Z3 Meteor, Void Rift, Frost Lance; spells 6,890 + weapon 352 · Z4 Meteor, Void Rift, Frost Lance; spells 7,077 + weapon 372 · Z5 Meteor, Void Rift, Frost Lance; spells 7,264 + weapon 387 · Z6 Meteor, Void Rift, Frost Lance; spells 7,451 + weapon 404 · Z7 Meteor, Void Rift, Frost Lance; spells 7,638 + weapon 418 · Z8 Meteor, Void Rift, Frost Lance; spells 7,825 + weapon 436
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,337 + weapon 1,260 · Z2 Sunray, Purify; spells 1,445 + weapon 1,369 · Z3 Sunray, Purify; spells 1,558 + weapon 1,506 · Z4 Sunray, Purify; spells 1,600 + weapon 1,562 · Z5 Sunray, Purify; spells 1,642 + weapon 1,611 · Z6 Sunray, Purify; spells 1,684 + weapon 1,668 · Z7 Sunray, Purify; spells 1,727 + weapon 1,718 · Z8 Sunray, Purify; spells 1,769 + weapon 1,775

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 277 | 160 | 556 | 3.5 |
| 2 | 283 | 158 | 568 | 3.6 |
| 3 | 288 | 158 | 577 | 3.7 |
| 4 | 288 | 152 | 577 | 3.8 |
| 5 | 285 | 144 | 572 | 4 |
| 6 | 285 | 138 | 571 | 4.1 |
| 7 | 285 | 135 | 570 | 4.2 |
| 8 | 390 | 183 | 781 | 4.3 |

### NG+5

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 11,494 dps · 2s / 176s · 26.8 / 3.1 hits | 11,824 dps · 1.8s / 193s · 19.6 / 2.7 hits | 12,126 dps · 1.9s / 210s · 19.5 / 3.3 hits | 12,489 dps · 2s / 211s · 16 / 2.5 hits | 12,824 dps · 2s / 210s · 12 / 1.3 hits | 13,221 dps · 2.5s / 209s · 12.5 / 1.4 hits | 13,532 dps · 2.2s / 209s · 14.3 / 1.7 hits | 13,874 dps · 2.9s / 287s · 10 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 10,716 dps · 2.2s / 189s · 23.5 / 2.7 hits | 11,030 dps · 2s / 207s · 17.2 / 2.4 hits | 11,316 dps · 2s / 225s · 17.2 / 2.9 hits | 11,664 dps · 2.2s / 226s · 14.1 / 2.2 hits | 12,012 dps · 2.2s / 224s · 10.5 / 1.1 hits | 12,398 dps · 2.7s / 222s · 11 / 1.2 hits | 12,693 dps · 2.3s / 222s · 12.6 / 1.5 hits | 12,988 dps · 3.1s / 307s · 8.7 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 15,538 dps · 1.5s / 130s · 29 / 3.3 hits | 15,980 dps · 1.4s / 143s · 21.2 / 2.9 hits | 16,388 dps · 1.4s / 155s · 21.1 / 3.5 hits | 16,911 dps · 1.5s / 156s · 17.3 / 2.7 hits | 17,412 dps · 1.5s / 155s · 13 / 1.4 hits | 17,944 dps · 1.8s / 154s · 13.5 / 1.5 hits | 18,324 dps · 1.6s / 154s · 15.4 / 1.8 hits | 18,784 dps · 2.1s / 212s · 10.8 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 6,388 dps · 3.7s / 317s · 23.5 / 2.7 hits | 6,568 dps · 3.3s / 347s · 17.2 / 2.4 hits | 6,734 dps · 3.4s / 378s · 17.2 / 2.9 hits | 6,931 dps · 3.7s / 380s · 14.1 / 2.2 hits | 7,115 dps · 3.7s / 378s · 10.5 / 1.1 hits | 7,329 dps · 4.5s / 376s · 11 / 1.2 hits | 7,500 dps · 4s / 376s · 12.6 / 1.5 hits | 7,686 dps · 5.2s / 518s · 8.7 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 4,123 dps · 5.7s / 491s · 26.8 / 3.1 hits | 4,241 dps · 5.1s / 538s · 19.6 / 2.7 hits | 4,350 dps · 5.2s / 585s · 19.5 / 3.3 hits | 4,479 dps · 5.7s / 588s · 16 / 2.5 hits | 4,599 dps · 5.7s / 585s · 12 / 1.3 hits | 4,741 dps · 6.9s / 582s · 12.5 / 1.4 hits | 4,852 dps · 6.1s / 582s · 14.3 / 1.7 hits | 4,975 dps · 8s / 800s · 10 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 5,666 dps · 4.1s / 358s · 23.5 / 2.7 hits | 5,805 dps · 3.7s / 393s · 17.2 / 2.4 hits | 5,937 dps · 3.8s / 429s · 17.2 / 2.9 hits | 6,077 dps · 4.2s / 433s · 14.1 / 2.2 hits | 6,216 dps · 4.2s / 433s · 10.5 / 1.1 hits | 6,359 dps · 5.2s / 434s · 11 / 1.2 hits | 6,496 dps · 4.6s / 435s · 12.6 / 1.5 hits | 6,632 dps · 6s / 600s · 8.7 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 8,462 dps · 2.8s / 239s · 23.5 / 2.7 hits | 8,668 dps · 2.5s / 263s · 17.2 / 2.4 hits | 8,865 dps · 2.6s / 287s · 17.2 / 2.9 hits | 9,071 dps · 2.8s / 290s · 14.1 / 2.2 hits | 9,278 dps · 2.8s / 290s · 10.5 / 1.1 hits | 9,488 dps · 3.5s / 291s · 11 / 1.2 hits | 9,691 dps · 3.1s / 291s · 12.6 / 1.5 hits | 9,893 dps · 4s / 402s · 8.7 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 3,637 dps · 6.4s / 557s · 23.5 / 2.7 hits | 3,738 dps · 5.8s / 610s · 17.2 / 2.4 hits | 3,824 dps · 5.9s / 666s · 17.2 / 2.9 hits | 3,926 dps · 6.5s / 671s · 14.1 / 2.2 hits | 4,029 dps · 6.5s / 668s · 10.5 / 1.1 hits | 4,140 dps · 7.9s / 666s · 11 / 1.2 hits | 4,235 dps · 7s / 666s · 12.6 / 1.5 hits | 4,331 dps · 9.2s / 919s · 8.7 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 5,259 + weapon 407 · Z2 Meteor, Void Rift, Arcane Beam; spells 5,382 + weapon 423 · Z3 Meteor, Void Rift, Arcane Beam; spells 5,504 + weapon 433 · Z4 Meteor, Void Rift, Arcane Beam; spells 5,627 + weapon 449 · Z5 Meteor, Void Rift, Arcane Beam; spells 5,750 + weapon 466 · Z6 Meteor, Void Rift, Arcane Beam; spells 5,872 + weapon 487 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,995 + weapon 500 · Z8 Meteor, Void Rift, Arcane Beam; spells 6,118 + weapon 514
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 8,011 + weapon 451 · Z2 Meteor, Void Rift, Frost Lance; spells 8,198 + weapon 469 · Z3 Meteor, Void Rift, Frost Lance; spells 8,385 + weapon 480 · Z4 Meteor, Void Rift, Frost Lance; spells 8,572 + weapon 499 · Z5 Meteor, Void Rift, Frost Lance; spells 8,759 + weapon 518 · Z6 Meteor, Void Rift, Frost Lance; spells 8,946 + weapon 542 · Z7 Meteor, Void Rift, Frost Lance; spells 9,133 + weapon 557 · Z8 Meteor, Void Rift, Frost Lance; spells 9,320 + weapon 573
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,811 + weapon 1,826 · Z2 Sunray, Purify; spells 1,853 + weapon 1,885 · Z3 Sunray, Purify; spells 1,896 + weapon 1,928 · Z4 Sunray, Purify; spells 1,938 + weapon 1,988 · Z5 Sunray, Purify; spells 1,980 + weapon 2,048 · Z6 Sunray, Purify; spells 2,022 + weapon 2,117 · Z7 Sunray, Purify; spells 2,065 + weapon 2,171 · Z8 Sunray, Purify; spells 2,107 + weapon 2,224

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 278 | 130 | 557 | 4.3 |
| 2 | 305 | 143 | 610 | 4.3 |
| 3 | 333 | 155 | 666 | 4.3 |
| 4 | 335 | 156 | 671 | 4.3 |
| 5 | 334 | 155 | 668 | 4.3 |
| 6 | 333 | 154 | 666 | 4.3 |
| 7 | 334 | 154 | 666 | 4.3 |
| 8 | 460 | 212 | 919 | 4.3 |

### NG+6

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 14,217 dps · 2s / 196s · 27.9 / 3.2 hits | 14,501 dps · 1.9s / 214s · 20.3 / 2.8 hits | 14,784 dps · 1.8s / 235s · 20.2 / 3.4 hits | 15,067 dps · 2.1s / 237s · 16.5 / 2.5 hits | 15,350 dps · 2s / 238s · 12.3 / 1.3 hits | 15,633 dps · 2.6s / 241s · 12.8 / 1.5 hits | 15,916 dps · 2.2s / 241s · 14.6 / 1.7 hits | 16,199 dps · 3s / 334s · 10.1 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 13,252 dps · 2.1s / 210s · 24.5 / 2.8 hits | 13,516 dps · 2s / 230s · 17.9 / 2.5 hits | 13,780 dps · 2s / 252s · 17.8 / 3 hits | 14,044 dps · 2.2s / 255s · 14.5 / 2.2 hits | 14,308 dps · 2.2s / 256s · 10.8 / 1.1 hits | 14,571 dps · 2.7s / 258s · 11.3 / 1.3 hits | 14,835 dps · 2.4s / 259s · 12.8 / 1.5 hits | 15,099 dps · 3.2s / 358s · 8.9 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 19,166 dps · 1.5s / 146s · 30.2 / 3.4 hits | 19,547 dps · 1.4s / 159s · 22 / 3 hits | 19,929 dps · 1.4s / 174s · 21.9 / 3.7 hits | 20,311 dps · 1.5s / 176s · 17.9 / 2.8 hits | 20,692 dps · 1.5s / 177s · 13.3 / 1.4 hits | 21,074 dps · 1.9s / 179s · 13.8 / 1.6 hits | 21,455 dps · 1.7s / 179s · 15.8 / 1.8 hits | 21,837 dps · 2.2s / 248s · 10.9 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 7,858 dps · 3.6s / 355s · 24.5 / 2.8 hits | 8,014 dps · 3.4s / 387s · 17.9 / 2.5 hits | 8,171 dps · 3.3s / 425s · 17.8 / 3 hits | 8,327 dps · 3.8s / 430s · 14.5 / 2.2 hits | 8,484 dps · 3.7s / 431s · 10.8 / 1.1 hits | 8,640 dps · 4.6s / 436s · 11.3 / 1.3 hits | 8,797 dps · 4s / 437s · 12.8 / 1.5 hits | 8,953 dps · 5.4s / 604s · 8.9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 5,098 dps · 5.5s / 547s · 27.9 / 3.2 hits | 5,199 dps · 5.2s / 597s · 20.3 / 2.8 hits | 5,301 dps · 5.1s / 656s · 20.2 / 3.4 hits | 5,402 dps · 5.8s / 662s · 16.5 / 2.5 hits | 5,504 dps · 5.7s / 665s · 12.3 / 1.3 hits | 5,605 dps · 7.1s / 671s · 12.8 / 1.5 hits | 5,707 dps · 6.2s / 673s · 14.6 / 1.7 hits | 5,808 dps · 8.3s / 932s · 10.1 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 6,771 dps · 4.1s / 412s · 24.5 / 2.8 hits | 6,908 dps · 3.9s / 449s · 17.9 / 2.5 hits | 7,053 dps · 3.8s / 493s · 17.8 / 3 hits | 7,190 dps · 4.3s / 498s · 14.5 / 2.2 hits | 7,335 dps · 4.3s / 499s · 10.8 / 1.1 hits | 7,473 dps · 5.4s / 504s · 11.3 / 1.3 hits | 7,615 dps · 4.7s / 504s · 12.8 / 1.5 hits | 7,752 dps · 6.2s / 698s · 8.9 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 10,099 dps · 2.8s / 276s · 24.5 / 2.8 hits | 10,302 dps · 2.6s / 301s · 17.9 / 2.5 hits | 10,514 dps · 2.6s / 331s · 17.8 / 3 hits | 10,717 dps · 2.9s / 334s · 14.5 / 2.2 hits | 10,931 dps · 2.9s / 335s · 10.8 / 1.1 hits | 11,135 dps · 3.6s / 338s · 11.3 / 1.3 hits | 11,343 dps · 3.1s / 339s · 12.8 / 1.5 hits | 11,548 dps · 4.2s / 469s · 8.9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 4,427 dps · 6.3s / 630s · 24.5 / 2.8 hits | 4,536 dps · 5.9s / 684s · 17.9 / 2.5 hits | 4,650 dps · 5.8s / 747s · 17.8 / 3 hits | 4,748 dps · 6.6s / 753s · 14.5 / 2.2 hits | 4,863 dps · 6.5s / 752s · 10.8 / 1.1 hits | 4,962 dps · 8.1s / 758s · 11.3 / 1.3 hits | 5,070 dps · 7s / 758s · 12.8 / 1.5 hits | 5,169 dps · 9.4s / 1,047s · 8.9 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 6,241 + weapon 531 · Z2 Meteor, Void Rift, Arcane Beam; spells 6,363 + weapon 545 · Z3 Meteor, Void Rift, Arcane Beam; spells 6,486 + weapon 567 · Z4 Meteor, Void Rift, Arcane Beam; spells 6,609 + weapon 581 · Z5 Meteor, Void Rift, Arcane Beam; spells 6,731 + weapon 604 · Z6 Meteor, Void Rift, Arcane Beam; spells 6,854 + weapon 619 · Z7 Meteor, Void Rift, Arcane Beam; spells 6,977 + weapon 638 · Z8 Meteor, Void Rift, Arcane Beam; spells 7,099 + weapon 653
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 9,507 + weapon 592 · Z2 Meteor, Void Rift, Frost Lance; spells 9,694 + weapon 608 · Z3 Meteor, Void Rift, Frost Lance; spells 9,881 + weapon 633 · Z4 Meteor, Void Rift, Frost Lance; spells 10,068 + weapon 650 · Z5 Meteor, Void Rift, Frost Lance; spells 10,255 + weapon 676 · Z6 Meteor, Void Rift, Frost Lance; spells 10,442 + weapon 693 · Z7 Meteor, Void Rift, Frost Lance; spells 10,629 + weapon 715 · Z8 Meteor, Void Rift, Frost Lance; spells 10,816 + weapon 732
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,149 + weapon 2,278 · Z2 Sunray, Purify; spells 2,192 + weapon 2,344 · Z3 Sunray, Purify; spells 2,234 + weapon 2,416 · Z4 Sunray, Purify; spells 2,276 + weapon 2,472 · Z5 Sunray, Purify; spells 2,318 + weapon 2,545 · Z6 Sunray, Purify; spells 2,361 + weapon 2,601 · Z7 Sunray, Purify; spells 2,403 + weapon 2,667 · Z8 Sunray, Purify; spells 2,445 + weapon 2,724

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 316 | 146 | 630 | 4.3 |
| 2 | 344 | 159 | 684 | 4.3 |
| 3 | 378 | 174 | 747 | 4.3 |
| 4 | 382 | 176 | 753 | 4.3 |
| 5 | 383 | 177 | 752 | 4.3 |
| 6 | 387 | 179 | 758 | 4.2 |
| 7 | 388 | 179 | 758 | 4.2 |
| 8 | 537 | 248 | 1,047 | 4.2 |

### NG+7

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 16,482 dps · 2s / 224s · 29.6 / 3.4 hits | 16,765 dps · 1.9s / 245s · 21.6 / 3 hits | 17,048 dps · 1.9s / 268s · 21.4 / 3.6 hits | 17,331 dps · 2.1s / 271s · 17.4 / 2.7 hits | 17,615 dps · 2.1s / 271s · 13 / 1.4 hits | 17,898 dps · 2.6s / 273s · 13.4 / 1.5 hits | 18,181 dps · 2.3s / 274s · 15.3 / 1.8 hits | 18,464 dps · 3s / 378s · 10.6 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 15,363 dps · 2.2s / 240s · 26 / 3 hits | 15,627 dps · 2s / 263s · 18.9 / 2.6 hits | 15,891 dps · 2s / 288s · 18.8 / 3.1 hits | 16,155 dps · 2.2s / 290s · 15.3 / 2.4 hits | 16,419 dps · 2.3s / 291s · 11.4 / 1.2 hits | 16,682 dps · 2.8s / 293s · 11.8 / 1.3 hits | 16,946 dps · 2.5s / 294s · 13.4 / 1.6 hits | 17,210 dps · 3.3s / 406s · 9.3 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 22,219 dps · 1.5s / 166s · 32 / 3.7 hits | 22,600 dps · 1.4s / 182s · 23.3 / 3.2 hits | 22,982 dps · 1.4s / 199s · 23.1 / 3.9 hits | 23,364 dps · 1.5s / 201s · 18.8 / 2.9 hits | 23,745 dps · 1.6s / 201s · 14 / 1.5 hits | 24,127 dps · 2s / 203s · 14.5 / 1.6 hits | 24,508 dps · 1.7s / 203s · 16.6 / 1.9 hits | 24,890 dps · 2.3s / 281s · 11.4 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 9,110 dps · 3.7s / 405s · 26 / 3 hits | 9,266 dps · 3.4s / 444s · 18.9 / 2.6 hits | 9,423 dps · 3.4s / 485s · 18.8 / 3.1 hits | 9,579 dps · 3.8s / 490s · 15.3 / 2.4 hits | 9,735 dps · 3.8s / 491s · 11.4 / 1.2 hits | 9,892 dps · 4.8s / 494s · 11.8 / 1.3 hits | 10,048 dps · 4.2s / 495s · 13.4 / 1.6 hits | 10,205 dps · 5.5s / 684s · 9.3 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 5,910 dps · 5.6s / 624s · 29.6 / 3.4 hits | 6,011 dps · 5.2s / 684s · 21.6 / 3 hits | 6,113 dps · 5.3s / 748s · 21.4 / 3.6 hits | 6,214 dps · 5.8s / 755s · 17.4 / 2.7 hits | 6,316 dps · 5.9s / 757s · 13 / 1.4 hits | 6,417 dps · 7.4s / 762s · 13.4 / 1.5 hits | 6,519 dps · 6.5s / 764s · 15.3 / 1.8 hits | 6,620 dps · 8.5s / 1,055s · 10.6 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 7,890 dps · 4.2s / 468s · 26 / 3 hits | 8,033 dps · 3.9s / 512s · 18.9 / 2.6 hits | 8,175 dps · 4s / 559s · 18.8 / 3.1 hits | 8,314 dps · 4.4s / 564s · 15.3 / 2.4 hits | 8,461 dps · 4.4s / 565s · 11.4 / 1.2 hits | 8,604 dps · 5.5s / 568s · 11.8 / 1.3 hits | 8,746 dps · 4.8s / 569s · 13.4 / 1.6 hits | 8,881 dps · 6.3s / 786s · 9.3 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 11,752 dps · 2.8s / 314s · 26 / 3 hits | 11,962 dps · 2.6s / 344s · 18.9 / 2.6 hits | 12,171 dps · 2.7s / 376s · 18.8 / 3.1 hits | 12,376 dps · 2.9s / 379s · 15.3 / 2.4 hits | 12,592 dps · 3s / 380s · 11.4 / 1.2 hits | 12,802 dps · 3.7s / 382s · 11.8 / 1.3 hits | 13,011 dps · 3.2s / 383s · 13.4 / 1.6 hits | 13,212 dps · 4.2s / 529s · 9.3 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 5,268 dps · 6.3s / 701s · 26 / 3 hits | 5,377 dps · 5.8s / 764s · 18.9 / 2.6 hits | 5,487 dps · 5.9s / 833s · 18.8 / 3.1 hits | 5,587 dps · 6.5s / 840s · 15.3 / 2.4 hits | 5,707 dps · 6.5s / 837s · 11.4 / 1.2 hits | 5,818 dps · 8.1s / 840s · 11.8 / 1.3 hits | 5,910 dps · 7.1s / 842s · 13.4 / 1.6 hits | 6,001 dps · 9.4s / 1,164s · 9.3 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 7,222 + weapon 668 · Z2 Meteor, Void Rift, Arcane Beam; spells 7,345 + weapon 688 · Z3 Meteor, Void Rift, Arcane Beam; spells 7,468 + weapon 708 · Z4 Meteor, Void Rift, Arcane Beam; spells 7,590 + weapon 724 · Z5 Meteor, Void Rift, Arcane Beam; spells 7,713 + weapon 748 · Z6 Meteor, Void Rift, Arcane Beam; spells 7,836 + weapon 768 · Z7 Meteor, Void Rift, Arcane Beam; spells 7,959 + weapon 788 · Z8 Meteor, Void Rift, Arcane Beam; spells 8,081 + weapon 800
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 11,003 + weapon 750 · Z2 Meteor, Void Rift, Frost Lance; spells 11,189 + weapon 772 · Z3 Meteor, Void Rift, Frost Lance; spells 11,376 + weapon 795 · Z4 Meteor, Void Rift, Frost Lance; spells 11,563 + weapon 813 · Z5 Meteor, Void Rift, Frost Lance; spells 11,750 + weapon 841 · Z6 Meteor, Void Rift, Frost Lance; spells 11,937 + weapon 865 · Z7 Meteor, Void Rift, Frost Lance; spells 12,124 + weapon 887 · Z8 Meteor, Void Rift, Frost Lance; spells 12,311 + weapon 901
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,487 + weapon 2,781 · Z2 Sunray, Purify; spells 2,530 + weapon 2,847 · Z3 Sunray, Purify; spells 2,572 + weapon 2,915 · Z4 Sunray, Purify; spells 2,614 + weapon 2,973 · Z5 Sunray, Purify; spells 2,656 + weapon 3,051 · Z6 Sunray, Purify; spells 2,699 + weapon 3,119 · Z7 Sunray, Purify; spells 2,741 + weapon 3,169 · Z8 Sunray, Purify; spells 2,783 + weapon 3,218

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 360 | 166 | 701 | 4.2 |
| 2 | 394 | 182 | 764 | 4.2 |
| 3 | 430 | 199 | 833 | 4.2 |
| 4 | 434 | 201 | 840 | 4.2 |
| 5 | 435 | 201 | 837 | 4.2 |
| 6 | 438 | 203 | 840 | 4.1 |
| 7 | 439 | 203 | 842 | 4.1 |
| 8 | 606 | 281 | 1,164 | 4.1 |

### NG+10

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 23,276 dps · 2.4s / 262s · 12 / 1.4 hits | 23,559 dps · 2.2s / 288s · 8.7 / 1.2 hits | 23,843 dps · 2.2s / 317s · 8.6 / 1.4 hits | 24,126 dps · 2.5s / 321s · 7 / 1.1 hits | 24,409 dps · 2.5s / 323s · 5.1 / 0.5 hits ⚠1-shot | 24,692 dps · 3.2s / 327s · 5.3 / 0.6 hits ⚠1-shot | 24,975 dps · 2.8s / 329s · 6 / 0.7 hits ⚠1-shot | 25,258 dps · 3.7s / 456s · 4.1 / 0.3 hits ⚠1-shot |
| Slicey: twin daggers | 21,696 dps · 2.6s / 281s · 10.5 / 1.2 hits | 21,960 dps · 2.3s / 309s · 7.6 / 1 hits | 22,224 dps · 2.4s / 340s · 7.5 / 1.3 hits | 22,487 dps · 2.7s / 344s · 6.1 / 0.9 hits ⚠1-shot | 22,751 dps · 2.7s / 347s · 4.5 / 0.5 hits ⚠1-shot | 23,015 dps · 3.4s / 350s · 4.7 / 0.5 hits ⚠1-shot | 23,279 dps · 3s / 353s · 5.3 / 0.6 hits ⚠1-shot | 23,543 dps · 3.9s / 490s · 3.6 / 0.2 hits ⚠1-shot |
| Quality: longsword + shield | 31,377 dps · 1.8s / 194s · 13 / 1.5 hits | 31,759 dps · 1.6s / 214s · 9.4 / 1.3 hits | 32,141 dps · 1.7s / 235s · 9.3 / 1.6 hits | 32,522 dps · 1.8s / 238s · 7.5 / 1.2 hits | 32,904 dps · 1.9s / 240s · 5.6 / 0.6 hits ⚠1-shot | 33,286 dps · 2.3s / 242s · 5.7 / 0.7 hits ⚠1-shot | 33,667 dps · 2.1s / 244s · 6.5 / 0.8 hits ⚠1-shot | 34,049 dps · 2.7s / 339s · 4.5 / 0.3 hits ⚠1-shot |
| Bow (Slicey) | 12,865 dps · 4.4s / 474s · 10.5 / 1.2 hits | 13,021 dps · 4s / 521s · 7.6 / 1 hits | 13,178 dps · 4.1s / 573s · 7.5 / 1.3 hits | 13,334 dps · 4.5s / 581s · 6.1 / 0.9 hits ⚠1-shot | 13,491 dps · 4.6s / 585s · 4.5 / 0.5 hits ⚠1-shot | 13,647 dps · 5.7s / 591s · 4.7 / 0.5 hits ⚠1-shot | 13,804 dps · 5s / 595s · 5.3 / 0.6 hits ⚠1-shot | 13,960 dps · 6.6s / 826s · 3.6 / 0.2 hits ⚠1-shot |
| Crossbow (Bonk) | 8,346 dps · 6.8s / 731s · 12 / 1.4 hits | 8,447 dps · 6.1s / 803s · 8.7 / 1.2 hits | 8,549 dps · 6.2s / 883s · 8.6 / 1.4 hits | 8,650 dps · 6.9s / 895s · 7 / 1.1 hits | 8,752 dps · 7s / 901s · 5.1 / 0.5 hits ⚠1-shot | 8,853 dps · 8.8s / 911s · 5.3 / 0.6 hits ⚠1-shot | 8,955 dps · 7.8s / 918s · 6 / 0.7 hits ⚠1-shot | 9,056 dps · 10.2s / 1,273s · 4.1 / 0.3 hits ⚠1-shot |
| Brain caster: staff spells | 11,175 dps · 5s / 546s · 10.5 / 1.2 hits | 11,311 dps · 4.6s / 600s · 7.6 / 1 hits | 11,445 dps · 4.7s / 659s · 7.5 / 1.3 hits | 11,580 dps · 5.2s / 669s · 6.1 / 0.9 hits ⚠1-shot | 11,715 dps · 5.3s / 673s · 4.5 / 0.5 hits ⚠1-shot | 11,850 dps · 6.6s / 681s · 4.7 / 0.5 hits ⚠1-shot | 11,985 dps · 5.8s / 686s · 5.3 / 0.6 hits ⚠1-shot | 12,120 dps · 7.6s / 951s · 3.6 / 0.2 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 16,625 dps · 3.4s / 367s · 10.5 / 1.2 hits | 16,826 dps · 3.1s / 403s · 7.6 / 1 hits | 17,026 dps · 3.1s / 443s · 7.5 / 1.3 hits | 17,227 dps · 3.5s / 449s · 6.1 / 0.9 hits ⚠1-shot | 17,428 dps · 3.5s / 453s · 4.5 / 0.5 hits ⚠1-shot | 17,628 dps · 4.4s / 458s · 4.7 / 0.5 hits ⚠1-shot | 17,829 dps · 3.9s / 461s · 5.3 / 0.6 hits ⚠1-shot | 18,030 dps · 5.1s / 639s · 3.6 / 0.2 hits ⚠1-shot |
| Prayer caster: talisman spells | 7,558 dps · 7.5s / 807s · 10.5 / 1.2 hits | 7,650 dps · 6.7s / 887s · 7.6 / 1 hits | 7,741 dps · 6.9s / 975s · 7.5 / 1.3 hits | 7,833 dps · 7.6s / 988s · 6.1 / 0.9 hits ⚠1-shot | 7,925 dps · 7.8s / 995s · 4.5 / 0.5 hits ⚠1-shot | 8,016 dps · 9.7s / 1,006s · 4.7 / 0.5 hits ⚠1-shot | 8,108 dps · 8.6s / 1,013s · 5.3 / 0.6 hits ⚠1-shot | 8,199 dps · 11.3s / 1,406s · 3.6 / 0.2 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 10,167 + weapon 1,008 · Z2 Meteor, Void Rift, Arcane Beam; spells 10,290 + weapon 1,021 · Z3 Meteor, Void Rift, Arcane Beam; spells 10,413 + weapon 1,033 · Z4 Meteor, Void Rift, Arcane Beam; spells 10,535 + weapon 1,045 · Z5 Meteor, Void Rift, Arcane Beam; spells 10,658 + weapon 1,057 · Z6 Meteor, Void Rift, Arcane Beam; spells 10,781 + weapon 1,070 · Z7 Meteor, Void Rift, Arcane Beam; spells 10,904 + weapon 1,082 · Z8 Meteor, Void Rift, Arcane Beam; spells 11,026 + weapon 1,094
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 15,489 + weapon 1,136 · Z2 Meteor, Void Rift, Frost Lance; spells 15,676 + weapon 1,149 · Z3 Meteor, Void Rift, Frost Lance; spells 15,863 + weapon 1,163 · Z4 Meteor, Void Rift, Frost Lance; spells 16,050 + weapon 1,177 · Z5 Meteor, Void Rift, Frost Lance; spells 16,237 + weapon 1,191 · Z6 Meteor, Void Rift, Frost Lance; spells 16,424 + weapon 1,205 · Z7 Meteor, Void Rift, Frost Lance; spells 16,611 + weapon 1,218 · Z8 Meteor, Void Rift, Frost Lance; spells 16,798 + weapon 1,232
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 3,502 + weapon 4,057 · Z2 Sunray, Purify; spells 3,544 + weapon 4,106 · Z3 Sunray, Purify; spells 3,586 + weapon 4,155 · Z4 Sunray, Purify; spells 3,628 + weapon 4,205 · Z5 Sunray, Purify; spells 3,671 + weapon 4,254 · Z6 Sunray, Purify; spells 3,713 + weapon 4,303 · Z7 Sunray, Purify; spells 3,755 + weapon 4,353 · Z8 Sunray, Purify; spells 3,797 + weapon 4,402

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 421 | 194 | 807 | 4.2 |
| 2 | 462 | 214 | 887 | 4.2 |
| 3 | 508 | 235 | 975 | 4.2 |
| 4 | 515 | 238 | 988 | 4.2 |
| 5 | 519 | 240 | 995 | 4.2 |
| 6 | 524 | 242 | 1,006 | 4.2 |
| 7 | 528 | 244 | 1,013 | 4.2 |
| 8 | 732 | 339 | 1,406 | 4.2 |

## 3. Gems, compared

Each gem at the level a zone 5 drop has (first playthrough) and a +0% roll, on the quality build (longsword) at zone 5. Weapon gems are compared by how much they raise sustained light-attack DPS; armour gems by how much they raise effective HP against zone 5's room hits. Families that do neither are listed with their raw value.

Gem level 7 (zone 5 drop), +0% roll. Base: 226 DPS, 11.8 average hits to die.

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
| Leech | weapon | 0.4% of max HP healed a hit (lifesteal) | — | heals 4.2% max HP per 10 s of attacking |
| Vigor | weapon | −16% stamina costs | +5% sustained, +0% burst DPS |  |
| Lingering | weapon | +15% spell duration (in a staff or talisman, its school's spells) | — |  |
| Expanse | weapon | +10% spell area size (in a staff or talisman, its school's spells) | — |  |
| Bulwark | armour | +16 defense to all types | +5% effective HP |  |
| Hearth | armour | +8% max HP | +5% effective HP |  |
| Zephyr | armour | +11.2% stamina regeneration | — |  |
| Gilt | armour | +11% Glowen found | — |  |

## 4. Weapons, weapon skills and spells

Every weapon at item level 5, rare, +0, held by a knight whose points (10 in each damage stat, plus 45 shared by the weapon's grades in proportion to their weight) suit that weapon. Best grip (one- or two-handed). Skills: listed damage multipliers × the weapon's power, per second of cooldown (single target; utility skills show 0).

| Weapon | Grades | Grip | Burst DPS | Sustained DPS | Per swing | Stamina/swing | Skills (dmg per s of cooldown) | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greathammer | S/- | 2H | 567 | 184 | 633 | 48.3 | Earthshaker 136, Meteor Lunge 110, Unstoppable 0 |  |
| Greataxe | A/- | 2H | 512 | 158 | 465 | 41.4 | Cleave Spin 83, Execute 47, Bloodlust 0 |  |
| Colossal Sword | A/E | 2H | 526 | 173 | 541 | 43.1 | Guillotine 97, Stomp 36, Charged Swing 112 |  |
| Crossbow | B/- | 2H | 293 | 96 | 288 | 41.4 | Piercing Bolt 51, Explosive Bolt 31, Rapid Fire 57 | ⚠ 0.62× median DPS |
| Club | E/- | 2H | 420 | 148 | 342 | 31.1 | Bonk 79, Wild Swing 38, Tantrum 0 |  |
| Twin Daggers | -/S | 2H | 752 | 250 | 198 | 13.8 | Shadow Step 105, Fan of Knives 28, Flurry 118 | ⚠ 1.62× median DPS |
| Rapier | -/A | 1H | 551 | 154 | 195 | 19 | Lunge 61, Riposte Stance 0, Thousand Cuts 66 |  |
| Katana | D/A | 2H | 694 | 266 | 318 | 15.5 | Iai Slash 82, Crescent 49, Blood Moon 0 | ⚠ 1.73× median DPS |
| Bow | -/B | 2H | 299 | 110 | 287 | 34.5 | Volley 79, Piercing Shot 40, Rain 15 |  |
| Whip | -/E | 1H | 345 | 137 | 224 | 20.7 | Lash 64, Crack 34, Serpent Coil 65 |  |
| Longsword | B/B | 2H | 571 | 209 | 324 | 20.7 | Shield Breaker 67, Spin Slash 38, Battle Cry 0 | ⚠ 1.36× median DPS |
| Spear | C/B | 2H | 423 | 145 | 255 | 24.2 | Impale 71, Sweep 34, Phalanx 0 |  |
| Battleaxe | A/D | 2H | 503 | 171 | 388 | 31.1 | Cleave 75, Hook 33, Frenzy 0 |  |
| Mace | B/E | 2H | 493 | 170 | 389 | 31.1 | Holy Smite 74, Consecrate 40, Judgment 27 |  |
| Halberd | A/C | 2H | 414 | 143 | 311 | 29.3 | Moulinet 92, Hook Pull 32, Vault 40 |  |
| Twin Axes | C/B | 2H | 542 | 219 | 361 | 20.7 | Whirlwind 106, Throw 48, Rampage 0 | ⚠ 1.42× median DPS |
| Hollow Maul | B/-/Br B | 2H | 372 | 127 | 391 | 41.4 | Singularity 57, Event Horizon 86, Null Shell 0 |  |
| Spellblade | -/B/Br B | 1H | 352 | 145 | 226 | 19 | Arc Wave 40, Blink Strike 36, Runic Edge 0 |  |
| Censer Flail | B/-/Pr B | 2H | 453 | 155 | 351 | 31.1 | Incense 61, Brimstone 52, Sanctified Flame 0 |  |
| Dawn Glaive | -/B/Pr B | 1H | 364 | 126 | 260 | 27.6 | Sunrise 54, Halo Throw 32, Judgement Ray 36 |  |
| Chakrams | E/B | 2H | 317 | 104 | 178 | 24.2 | Orbit 52, Ring Storm 10, Grand Ring 18 | ⚠ 0.67× median DPS |
| Cestus | A/- | 2H | 635 | 190 | 222 | 17.3 | Jab Rush 80, Uppercut 46, Iron Skin 0 |  |
| Rune Kris | -/B/Br B | 1H | 427 | 127 | 133 | 15.5 | Hex Cut 40, Rune Shards 14, Mirror Step 16 |  |
| Hex Hammer | B/-/Br B | 2H | 454 | 165 | 321 | 25.9 | Null Slam 61, Gravity Hook 31, Curse of Weight 0 |  |
| Harvest Sickle | -/B/Pr B | 1H | 390 | 147 | 233 | 20.7 | Reap 47, Harvest Hook 26, Bountiful Harvest 0 |  |

Spells at Spell Skill 100 (single target; fans count one projectile, ticking areas their whole duration):

| Spell | School | Damage | Cast s | Cooldown s | Stamina | Dmg / busy s | Dmg / stamina | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arcane Bolt | brain | 19 | 0.3 | 1.2 | 8 | 16 | 2.4 |  |
| Scatter Shards | brain | 14 | 0.4 | 4 | 14 | 3.5 | 1 |  |
| Frost Lance | brain | 40 | 0.5 | 5 | 16 | 8 | 2.5 |  |
| Fireball | brain | 30 | 0.6 | 6 | 18 | 5 | 1.7 |  |
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
| NG+1 | 40,954 → L84 | 34,882 → L90 | 37,760 → L96 | 66,106 → L105 | 73,217 → L117 | 40,022 → L127 | 47,582 → L134 | 42,447 → L142 |
| NG+2 | 45,227 → L149 | 39,408 → L155 | 42,090 → L162 | 72,355 → L171 | 80,658 → L184 | 45,177 → L194 | 53,067 → L202 | 45,671 → L210 |
| NG+3 | 49,237 → L217 | 42,440 → L225 | 45,635 → L232 | 80,185 → L242 | 89,388 → L255 | 50,622 → L266 | 57,748 → L275 | 49,919 → L283 |
| NG+4 | 54,137 → L291 | 47,787 → L299 | 51,053 → L306 | 87,446 → L317 | 98,092 → L332 | 54,327 → L343 | 62,783 → L352 | 56,229 → L360 |
| NG+5 | 60,409 → L369 | 53,211 → L377 | 55,162 → L385 | 95,999 → L396 | 106,787 → L411 | 58,810 → L424 | 71,458 → L433 | 60,768 → L443 |
| NG+6 | 66,172 → L452 | 56,247 → L461 | 61,743 → L470 | 108,144 → L482 | 117,715 → L499 | 66,585 → L512 | 76,188 → L522 | 68,155 → L532 |
| NG+7 | 74,076 → L541 | 62,486 → L551 | 66,585 → L560 | 116,513 → L572 | 127,838 → L589 | 71,919 → L603 | 84,120 → L614 | 75,031 → L624 |
| NG+10 | 94,486 → L839 | 80,546 → L850 | 89,679 → L861 | 155,710 → L876 | 173,308 → L896 | 94,603 → L912 | 113,628 → L924 | 98,547 → L937 |

Reinforcement: each +1 is +20% (×4 at +15), against rarity steps of ×1.06–×1.28. Glowen per step:

| + | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 | +11 | +12 | +13 | +14 | +15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Glowen | 320 | 464 | 673 | 976 | 1,415 | 2,051 | 2,974 | 4,312 | 6,253 | 9,067 | 13,147 | 19,063 | 27,642 | 40,081 | 58,117 |
| Power | ×1.15 | ×1.3 | ×1.45 | ×1.6 | ×1.75 | ×1.9 | ×2.05 | ×2.2 | ×2.35 | ×2.5 | ×2.65 | ×2.8 | ×2.95 | ×3.1 | ×3.25 |

## 6. Growth: player against the world

How the quality build's damage and toughness grow against the zone's enemies (zone 1 of the first playthrough = 1.00). A healthy curve keeps both ratios near 1.

| Cycle | Zone | Level | DPS | Foe HP | TTK s | Max HP | Hit taken | Hits to die | Kill time × | Survival × | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First playthrough | 1 | L6 | 44 | 90 | 2 | 293 | 22 | 13.1 | 1 | 1 |  |
| First playthrough | 2 | L15 | 69 | 122 | 1.8 | 345 | 22 | 15.5 | 0.88 | 1.18 |  |
| First playthrough | 3 | L26 | 103 | 166 | 1.6 | 398 | 33 | 12.2 | 0.79 | 0.93 |  |
| First playthrough | 4 | L37 | 158 | 217 | 1.4 | 450 | 36 | 12.6 | 0.68 | 0.96 |  |
| First playthrough | 5 | L47 | 226 | 253 | 1.1 | 503 | 43 | 11.8 | 0.55 | 0.9 |  |
| First playthrough | 6 | L57 | 330 | 354 | 1.1 | 555 | 49 | 11.2 | 0.53 | 0.86 |  |
| First playthrough | 7 | L67 | 394 | 351 | 0.9 | 608 | 48 | 12.6 | 0.44 | 0.96 |  |
| First playthrough | 8 | L76 | 462 | 521 | 1.1 | 645 | 52 | 12.3 | 0.56 | 0.94 |  |
| NG+1 | 1 | L84 | 586 | 780 | 1.3 | 665 | 45 | 14.8 | 0.66 | 1.13 |  |
| NG+1 | 2 | L90 | 720 | 987 | 1.4 | 685 | 62 | 11 | 0.67 | 0.84 |  |
| NG+1 | 3 | L96 | 874 | 1,518 | 1.7 | 705 | 60 | 11.7 | 0.86 | 0.89 |  |
| NG+1 | 4 | L105 | 977 | 1,916 | 2 | 735 | 60 | 12.2 | 0.97 | 0.93 |  |
| NG+1 | 5 | L117 | 1,096 | 2,065 | 1.9 | 765 | 69 | 11.2 | 0.93 | 0.85 |  |
| NG+1 | 6 | L127 | 1,211 | 2,753 | 2.3 | 795 | 73 | 10.8 | 1.12 | 0.83 |  |
| NG+1 | 7 | L134 | 1,319 | 2,464 | 1.9 | 815 | 61 | 13.4 | 0.92 | 1.02 |  |
| NG+1 | 8 | L142 | 1,436 | 3,481 | 2.4 | 854 | 86 | 10 | 1.19 | 0.76 |  |
| NG+2 | 1 | L149 | 1,673 | 4,747 | 2.8 | 883 | 56 | 15.8 | 1.4 | 1.2 |  |
| NG+2 | 2 | L155 | 1,955 | 5,281 | 2.7 | 912 | 79 | 11.6 | 1.33 | 0.89 |  |
| NG+2 | 3 | L162 | 2,255 | 5,963 | 2.6 | 941 | 81 | 11.6 | 1.3 | 0.88 |  |
| NG+2 | 4 | L171 | 2,473 | 6,935 | 2.8 | 985 | 85 | 11.6 | 1.38 | 0.89 |  |
| NG+2 | 5 | L184 | 2,850 | 7,566 | 2.7 | 1,028 | 104 | 9.9 | 1.31 | 0.76 |  |
| NG+2 | 6 | L194 | 3,150 | 10,091 | 3.2 | 1,072 | 115 | 9.3 | 1.58 | 0.71 |  |
| NG+2 | 7 | L202 | 3,403 | 9,429 | 2.8 | 1,115 | 98 | 11.4 | 1.37 | 0.87 |  |
| NG+2 | 8 | L210 | 3,721 | 12,920 | 3.5 | 1,144 | 146 | 7.9 | 1.71 | 0.6 |  |
| NG+3 | 1 | L217 | 4,253 | 12,318 | 2.9 | 1,173 | 61 | 19.1 | 1.43 | 1.46 |  |
| NG+3 | 2 | L225 | 4,859 | 10,968 | 2.3 | 1,217 | 90 | 13.6 | 1.11 | 1.03 |  |
| NG+3 | 3 | L232 | 5,510 | 11,551 | 2.1 | 1,246 | 97 | 12.9 | 1.03 | 0.98 |  |
| NG+3 | 4 | L242 | 5,975 | 12,652 | 2.1 | 1,289 | 102 | 12.7 | 1.04 | 0.97 |  |
| NG+3 | 5 | L255 | 6,560 | 13,389 | 2 | 1,347 | 128 | 10.5 | 1.01 | 0.8 |  |
| NG+3 | 6 | L266 | 7,092 | 16,840 | 2.4 | 1,391 | 146 | 9.5 | 1.17 | 0.73 |  |
| NG+3 | 7 | L275 | 7,605 | 15,193 | 2 | 1,434 | 130 | 11.1 | 0.98 | 0.84 |  |
| NG+3 | 8 | L283 | 8,104 | 20,132 | 2.5 | 1,463 | 199 | 7.4 | 1.22 | 0.56 |  |
| NG+4 | 1 | L291 | 9,023 | 19,317 | 2.1 | 1,507 | 70 | 21.6 | 1.05 | 1.65 |  |
| NG+4 | 2 | L299 | 10,111 | 17,287 | 1.7 | 1,536 | 104 | 14.8 | 0.84 | 1.13 |  |
| NG+4 | 3 | L306 | 11,206 | 17,759 | 1.6 | 1,536 | 113 | 13.5 | 0.78 | 1.03 |  |
| NG+4 | 4 | L317 | 12,014 | 20,038 | 1.7 | 1,536 | 120 | 12.8 | 0.82 | 0.97 |  |
| NG+4 | 5 | L332 | 12,962 | 20,678 | 1.6 | 1,536 | 153 | 10.1 | 0.79 | 0.77 |  |
| NG+4 | 6 | L343 | 13,836 | 26,699 | 1.9 | 1,536 | 173 | 8.9 | 0.95 | 0.68 |  |
| NG+4 | 7 | L352 | 14,580 | 23,519 | 1.6 | 1,536 | 152 | 10.1 | 0.79 | 0.77 |  |
| NG+4 | 8 | L360 | 15,134 | 31,917 | 2.1 | 1,536 | 230 | 6.7 | 1.04 | 0.51 |  |
| NG+5 | 1 | L369 | 15,538 | 23,380 | 1.5 | 1,536 | 69 | 22.3 | 0.74 | 1.7 |  |
| NG+5 | 2 | L377 | 15,980 | 21,758 | 1.4 | 1,536 | 105 | 14.6 | 0.67 | 1.11 |  |
| NG+5 | 3 | L385 | 16,388 | 22,616 | 1.4 | 1,536 | 118 | 13 | 0.68 | 0.99 |  |
| NG+5 | 4 | L396 | 16,911 | 25,399 | 1.5 | 1,536 | 122 | 12.6 | 0.74 | 0.96 |  |
| NG+5 | 5 | L411 | 17,412 | 26,210 | 1.5 | 1,536 | 153 | 10.1 | 0.74 | 0.77 |  |
| NG+5 | 6 | L424 | 17,944 | 32,869 | 1.8 | 1,536 | 170 | 9.1 | 0.9 | 0.69 |  |
| NG+5 | 7 | L433 | 18,324 | 29,709 | 1.6 | 1,536 | 146 | 10.5 | 0.8 | 0.8 |  |
| NG+5 | 8 | L443 | 18,784 | 39,949 | 2.1 | 1,536 | 224 | 6.9 | 1.05 | 0.52 |  |
| NG+6 | 1 | L452 | 19,166 | 27,962 | 1.5 | 1,536 | 66 | 23.3 | 0.72 | 1.78 |  |
| NG+6 | 2 | L461 | 19,547 | 26,927 | 1.4 | 1,536 | 101 | 15.1 | 0.68 | 1.15 |  |
| NG+6 | 3 | L470 | 19,929 | 27,119 | 1.4 | 1,536 | 114 | 13.5 | 0.67 | 1.03 |  |
| NG+6 | 4 | L482 | 20,311 | 31,234 | 1.5 | 1,536 | 118 | 13 | 0.76 | 0.99 |  |
| NG+6 | 5 | L499 | 20,692 | 31,394 | 1.5 | 1,536 | 149 | 10.3 | 0.75 | 0.79 |  |
| NG+6 | 6 | L512 | 21,074 | 39,993 | 1.9 | 1,536 | 166 | 9.3 | 0.93 | 0.71 |  |
| NG+6 | 7 | L522 | 21,455 | 35,545 | 1.7 | 1,536 | 143 | 10.7 | 0.82 | 0.82 |  |
| NG+6 | 8 | L532 | 21,837 | 48,413 | 2.2 | 1,536 | 220 | 7 | 1.09 | 0.53 |  |
| NG+7 | 1 | L541 | 22,219 | 33,261 | 1.5 | 1,536 | 62 | 24.7 | 0.74 | 1.88 |  |
| NG+7 | 2 | L551 | 22,600 | 31,208 | 1.4 | 1,536 | 96 | 16 | 0.68 | 1.22 |  |
| NG+7 | 3 | L560 | 22,982 | 32,369 | 1.4 | 1,536 | 108 | 14.2 | 0.69 | 1.09 |  |
| NG+7 | 4 | L572 | 23,364 | 36,200 | 1.5 | 1,536 | 112 | 13.7 | 0.76 | 1.04 |  |
| NG+7 | 5 | L589 | 23,745 | 37,356 | 1.6 | 1,536 | 142 | 10.8 | 0.77 | 0.83 |  |
| NG+7 | 6 | L603 | 24,127 | 47,345 | 2 | 1,536 | 158 | 9.7 | 0.97 | 0.74 |  |
| NG+7 | 7 | L614 | 24,508 | 42,209 | 1.7 | 1,536 | 137 | 11.2 | 0.85 | 0.86 |  |
| NG+7 | 8 | L624 | 24,890 | 56,110 | 2.3 | 1,536 | 211 | 7.3 | 1.11 | 0.56 |  |
| NG+10 | 1 | L839 | 31,377 | 56,365 | 1.8 | 1,536 | 154 | 10 | 0.88 | 0.76 |  |
| NG+10 | 2 | L850 | 31,759 | 51,511 | 1.6 | 1,536 | 238 | 6.5 | 0.8 | 0.49 | ⚠ survives 2× fewer hits |
| NG+10 | 3 | L861 | 32,141 | 53,428 | 1.7 | 1,536 | 269 | 5.7 | 0.82 | 0.44 | ⚠ survives 2.3× fewer hits |
| NG+10 | 4 | L876 | 32,522 | 59,750 | 1.8 | 1,536 | 282 | 5.5 | 0.9 | 0.42 | ⚠ survives 2.4× fewer hits |
| NG+10 | 5 | L896 | 32,904 | 61,658 | 1.9 | 1,536 | 357 | 4.3 | 0.92 | 0.33 | ⚠ survives 3× fewer hits |
| NG+10 | 6 | L912 | 33,286 | 78,146 | 2.3 | 1,536 | 400 | 3.8 | 1.16 | 0.29 | ⚠ survives 3.4× fewer hits |
| NG+10 | 7 | L924 | 33,667 | 69,669 | 2.1 | 1,536 | 347 | 4.4 | 1.02 | 0.34 | ⚠ survives 3× fewer hits |
| NG+10 | 8 | L937 | 34,049 | 92,613 | 2.7 | 1,536 | 540 | 2.8 | 1.34 | 0.22 | ⚠ survives 4.6× fewer hits |

