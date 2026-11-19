# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Slicey: twin daggers build (732 HP) in one hit (0.93). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
2. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Bow (Slicey) build (722 HP) in one hit (0.91). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
3. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Brain caster: staff spells build (722 HP) in one hit (0.91). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
4. **Build spread** (severity 5.2): NG+5 zone 8: the slowest build (Prayer caster: talisman spells) takes 849 s on the boss, 4.4× the fastest (Quality: greatsword + shield, 195 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
5. **Build spread** (severity 5.2): NG+5 zone 6: the slowest build (Prayer caster: talisman spells) takes 615 s on the boss, 4.3× the fastest (Quality: greatsword + shield, 141 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
6. **Build spread** (severity 5.2): NG+6 zone 1: the slowest build (Prayer caster: talisman spells) takes 582 s on the boss, 4.3× the fastest (Quality: greatsword + shield, 134 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
7. **Weapons** (severity 4.8): Crossbow: 108 sustained light-attack DPS, 0.53× the median weapon (205) at equal fitting stats. *Suggested:* Raise its base damage / combo multipliers (D40: poor scaling should mean higher base, not lower DPS).
8. **Gems** (severity 4.6): Quicksilver raises sustained DPS by +3% (burst +7%) where Brutal gives +6% (0.41× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
9. **Weapons** (severity 4.5): Club: 366 sustained light-attack DPS, 1.79× the median weapon (205) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
10. **Boss length** (severity 4.4): NG+5 zone 8: the median build needs 425 s of nonstop hitting to kill The Landlord (3,981,273 HP), 7.1 minutes before any dodging (target 11 min, D301). *Suggested:* Raise its NG_BOSS_HP factor (D301).
11. **Weapons** (severity 4.3): Katana: 348 sustained light-attack DPS, 1.7× the median weapon (205) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
12. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
13. **Boss length** (severity 4.2): NG+4 zone 8: the median build needs 359 s of nonstop hitting to kill The Landlord (2,769,325 HP), 6 minutes before any dodging (target 11 min, D301). *Suggested:* Raise its NG_BOSS_HP factor (D301).
14. **Boss length** (severity 4.2): NG+6 zone 7: the median build needs 358 s of nonstop hitting to kill Archmagister Tock (3,840,801 HP), 6 minutes before any dodging (target 8 min, D301). *Suggested:* Raise its NG_BOSS_HP factor (D301).
15. **Weapons** (severity 4.1): Twin Daggers: 331 sustained light-attack DPS, 1.62× the median weapon (205) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
16. **Weapon skills** (severity 4): Colossal Sword's skills deal 335 damage per second of cooldown, 2.03× the median weapon's (165). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
17. **Weapon skills** (severity 4): Twin Daggers's skills deal 332 damage per second of cooldown, 2.01× the median weapon's (165). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
18. **Builds** (severity 4): First playthrough zone 1: the Brain caster: S staff (Archmagister's Rod) build at level 6 does not meet its own casting tool's requirements at item level 1 (40% damage, no skills). *Suggested:* Item-level requirements (+2 a level on the primary stat) outpace the points a focused build has; ease reqAtIlvl or the NG+ item level.
19. **Builds** (severity 4): First playthrough zone 2: the Brain caster: S staff (Archmagister's Rod) build at level 15 does not meet its own casting tool's requirements at item level 2 (40% damage, no skills). *Suggested:* Item-level requirements (+2 a level on the primary stat) outpace the points a focused build has; ease reqAtIlvl or the NG+ item level.
20. **Weapons** (severity 3.8): Bow: 136 sustained light-attack DPS, 0.66× the median weapon (205) at equal fitting stats. *Suggested:* Raise its base damage / combo multipliers (D40: poor scaling should mean higher base, not lower DPS).
21. **Enemy curve** (severity 3.8): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 108. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
22. **Enemy curve** (severity 3.4): NG+4: zone 7 room enemies have 23,519 HP on average, below zone 6's 26,699. *Suggested:* Check the zone roster mix and the HP curve.
23. **Enemy curve** (severity 3.3): NG+6: zone 7 room enemies have 35,545 HP on average, below zone 6's 39,993. *Suggested:* Check the zone roster mix and the HP curve.
24. **Enemy curve** (severity 3.2): NG+3: zone 2 room enemies have 10,968 HP on average, below zone 1's 12,318. *Suggested:* Check the zone roster mix and the HP curve.
25. **Boss curve** (severity 3.2): NG+1: Foreman Ignatius (zone 5) has 111,403 HP over all phases, below zone 4's boss (113,929). *Suggested:* Raise its baseHp / phase bars, or lower the previous boss.
26. **Gear power** (severity 3): Reinforcement reaches ×3.25 at +15, while the whole rarity ladder is ×1.28: a +15 common out-hits a +0 legendary 2.5×, so drops matter little once reinforcement starts. *Suggested:* Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.
27. **Boss curve** (severity 2.9): NG+1: The Bloatking (zone 3) averages 631 a hit, below zone 2's boss (705). *Suggested:* Raise its phase damage multipliers.

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
| 7 | Archmagister Tock | 2 | 12,626 / 8,417 | 21,043 | 271 / 400 | 508 |  |
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
| 7 | Archmagister Tock | 3 | 42,169 / 49,197 / 49,197 | 140,563 | 909 / 1,343 / 1,575 | 1,961 |  |
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
| 7 | Archmagister Tock | 3 | 166,809 / 194,611 / 194,611 | 556,030 | 2,524 / 3,726 / 4,373 | 5,442 |  |
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
| 7 | Archmagister Tock | 3 | 316,733 / 369,521 / 369,521 | 1,055,775 | 5,168 / 7,631 / 8,954 | 11,143 |  |
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
| 7 | Archmagister Tock | 3 | 589,489 / 687,737 / 687,737 | 1,964,962 | 8,683 / 12,821 / 15,045 | 18,723 |  |
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
| 7 | Archmagister Tock | 3 | 846,795 / 987,927 / 987,927 | 2,822,648 | 9,985 / 14,744 / 17,302 | 21,531 |  |
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
| 7 | Archmagister Tock | 3 | 1,152,240 / 1,344,280 / 1,344,280 | 3,840,801 | 11,328 / 16,727 / 19,628 | 24,426 |  |
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
| 7 | Archmagister Tock | 3 | 1,493,415 / 1,742,318 / 1,742,318 | 4,978,050 | 12,313 / 18,182 / 21,335 | 26,551 |  |
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
| 7 | Archmagister Tock | 3 | 2,464,974 / 2,875,803 / 2,875,803 | 8,216,581 | 42,611 / 62,918 / 73,832 | 91,880 |  |
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
| Bonk: greathammer (2H) | 37 dps · 2.4s / 68s · 17.7 / 3.7 hits | 64 dps · 1.9s / 87s · 23.2 / 3.1 hits | 103 dps · 1.6s / 74s · 19.4 / 3.9 hits | 169 dps · 1.3s / 62s · 17.8 / 3.2 hits | 253 dps · 1s / 68s · 15.4 / 2.2 hits | 387 dps · 0.9s / 49s · 16.6 / 2.8 hits | 482 dps · 0.7s / 44s · 17.7 / 3 hits | 597 dps · 0.9s / 94s · 18.5 / 1.4 hits |
| Slicey: twin daggers | 35 dps · 2.6s / 72s · 13 / 2.7 hits | 59 dps · 2.1s / 95s · 17.4 / 2.4 hits | 95 dps · 1.7s / 80s · 14.8 / 3 hits | 158 dps · 1.4s / 67s · 13.8 / 2.5 hits | 238 dps · 1.1s / 72s · 12.1 / 1.7 hits | 367 dps · 1s / 51s · 13.2 / 2.2 hits | 460 dps · 0.8s / 46s · 14.2 / 2.4 hits | 553 dps · 0.9s / 102s · 15.2 / 1.1 hits |
| Quality: greatsword + shield | 45 dps · 2s / 55s · 16.8 / 3.5 hits | 72 dps · 1.7s / 78s · 22.4 / 3 hits | 110 dps · 1.5s / 69s · 19 / 3.8 hits | 171 dps · 1.3s / 61s · 17.7 / 3.2 hits | 252 dps · 1s / 68s · 15.5 / 2.2 hits | 377 dps · 0.9s / 50s · 16.7 / 2.8 hits | 460 dps · 0.8s / 46s · 18 / 3 hits | 550 dps · 0.9s / 103s · 19.1 / 1.4 hits |
| Bow (Slicey) | 29 dps · 3.1s / 86s · 12.2 / 2.5 hits | 47 dps · 2.6s / 119s · 16.5 / 2.2 hits | 72 dps · 2.3s / 105s · 14.1 / 2.8 hits | 114 dps · 1.9s / 92s · 13.3 / 2.4 hits | 167 dps · 1.5s / 103s · 11.7 / 1.7 hits | 254 dps · 1.4s / 74s · 12.7 / 2.1 hits | 311 dps · 1.1s / 68s · 13.8 / 2.3 hits | 368 dps · 1.4s / 153s · 14.8 / 1.1 hits |
| Crossbow (Bonk) | 18 dps · 4.9s / 139s · 17.7 / 3.7 hits | 29 dps · 4.2s / 192s · 23.2 / 3.1 hits | 45 dps · 3.7s / 169s · 19.4 / 3.9 hits | 71 dps · 3.1s / 149s · 17.8 / 3.2 hits | 107 dps · 2.4s / 160s · 15.4 / 2.2 hits | 160 dps · 2.2s / 117s · 16.6 / 2.8 hits | 196 dps · 1.8s / 107s · 17.7 / 3 hits | 232 dps · 2.2s / 243s · 18.5 / 1.4 hits |
| Brain caster: staff spells | 36 dps · 2.5s / 69s · 12.2 / 2.5 hits | 47 dps · 2.6s / 118s · 16.5 / 2.2 hits | 83 dps · 2s / 91s · 14.1 / 2.8 hits | 125 dps · 1.7s / 84s · 13.3 / 2.4 hits | 177 dps · 1.4s / 97s · 11.7 / 1.7 hits | 256 dps · 1.4s / 74s · 12.7 / 2.1 hits | 305 dps · 1.2s / 69s · 13.8 / 2.3 hits | 353 dps · 1.5s / 160s · 14.8 / 1.1 hits |
| Brain caster: S staff (Archmagister's Rod) | 56 dps · 1.6s / 45s · 12.2 / 2.5 hits ⚠req | 76 dps · 1.6s / 73s · 16.5 / 2.2 hits ⚠req | 139 dps · 1.2s / 54s · 14.1 / 2.8 hits | 214 dps · 1s / 49s · 13.3 / 2.4 hits | 309 dps · 0.8s / 55s · 11.7 / 1.7 hits | 453 dps · 0.8s / 42s · 12.7 / 2.1 hits | 550 dps · 0.6s / 38s · 13.8 / 2.3 hits | 640 dps · 0.8s / 88s · 14.8 / 1.1 hits |
| Prayer caster: talisman spells | 35 dps · 2.6s / 72s · 13 / 2.7 hits | 33 dps · 3.7s / 167s · 17.4 / 2.4 hits | 51 dps · 3.2s / 148s · 14.8 / 3 hits | 80 dps · 2.7s / 132s · 13.8 / 2.5 hits | 116 dps · 2.2s / 148s · 12.1 / 1.7 hits | 171 dps · 2.1s / 110s · 13.2 / 2.2 hits | 208 dps · 1.7s / 101s · 14.2 / 2.4 hits | 243 dps · 2.1s / 232s · 15.2 / 1.1 hits |

- Brain caster: staff spells: Z1 Void Rift, Frost Lance, Chain Lightning; spells 30 + weapon 6 · Z2 Void Rift, Frost Lance, Chain Lightning; spells 44 + weapon 4 · Z3 Meteor, Void Rift, Frost Lance; spells 77 + weapon 6 · Z4 Meteor, Void Rift, Frost Lance; spells 116 + weapon 9 · Z5 Meteor, Void Rift, Frost Lance; spells 164 + weapon 13 · Z6 Meteor, Void Rift, Frost Lance; spells 237 + weapon 19 · Z7 Meteor, Void Rift, Frost Lance; spells 284 + weapon 22 · Z8 Meteor, Void Rift, Frost Lance; spells 328 + weapon 25
- Brain caster: S staff (Archmagister's Rod): Z1 Void Rift, Frost Lance, Chain Lightning; spells 49 + weapon 6 · Z2 Void Rift, Frost Lance, Chain Lightning; spells 72 + weapon 4 · Z3 Meteor, Void Rift, Frost Lance; spells 133 + weapon 6 · Z4 Meteor, Void Rift, Frost Lance; spells 204 + weapon 10 · Z5 Meteor, Void Rift, Frost Lance; spells 296 + weapon 13 · Z6 Meteor, Void Rift, Frost Lance; spells 434 + weapon 19 · Z7 Meteor, Void Rift, Frost Lance; spells 527 + weapon 22 · Z8 Meteor, Void Rift, Frost Lance; spells 614 + weapon 26
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 14 + weapon 21 · Z2 Sunray, Purify; spells 20 + weapon 13 · Z3 Sunray, Purify; spells 31 + weapon 21 · Z4 Sunray, Purify; spells 47 + weapon 33 · Z5 Sunray, Purify; spells 68 + weapon 48 · Z6 Sunray, Purify; spells 99 + weapon 72 · Z7 Sunray, Purify; spells 120 + weapon 88 · Z8 Sunray, Purify; spells 139 + weapon 104

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 71 | 45 | 139 | 3.1 |
| 2 | 107 | 73 | 192 | 2.6 |
| 3 | 85 | 54 | 169 | 3.1 |
| 4 | 75 | 49 | 149 | 3 |
| 5 | 84 | 55 | 160 | 2.9 |
| 6 | 63 | 42 | 117 | 2.8 |
| 7 | 57 | 38 | 107 | 2.8 |
| 8 | 128 | 88 | 243 | 2.8 |

### NG+1

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 787 dps · 1s / 75s · 18.7 / 2.1 hits | 988 dps · 1s / 76s · 15.9 / 1.9 hits | 1,208 dps · 1.3s / 82s · 18.7 / 3.1 hits | 1,395 dps · 1.4s / 82s · 17.1 / 2.6 hits | 1,599 dps · 1.3s / 70s · 14.7 / 1.6 hits | 1,797 dps · 1.5s / 70s · 16.6 / 1.9 hits | 1,985 dps · 1.2s / 71s · 20 / 2.3 hits | 2,173 dps · 1.6s / 117s · 15.8 / 1.1 hits |
| Slicey: twin daggers | 727 dps · 1.1s / 82s · 15.4 / 1.7 hits | 915 dps · 1.1s / 82s · 13.1 / 1.6 hits | 1,119 dps · 1.4s / 89s · 15.4 / 2.6 hits | 1,291 dps · 1.5s / 88s · 14.2 / 2.1 hits | 1,510 dps · 1.4s / 74s · 12.3 / 1.3 hits | 1,718 dps · 1.6s / 73s · 13.8 / 1.6 hits | 1,921 dps · 1.3s / 73s · 16.7 / 1.9 hits | 2,117 dps · 1.6s / 120s · 13.3 / 0.9 hits ⚠1-shot |
| Quality: greatsword + shield | 714 dps · 1.1s / 83s · 19.3 / 2.1 hits | 889 dps · 1.1s / 85s · 16.4 / 1.9 hits | 1,088 dps · 1.4s / 91s · 19.4 / 3.2 hits | 1,242 dps · 1.5s / 92s · 17.8 / 2.7 hits | 1,429 dps · 1.4s / 78s · 15.4 / 1.6 hits | 1,611 dps · 1.7s / 78s · 17.3 / 2 hits | 1,782 dps · 1.4s / 79s · 20.9 / 2.4 hits | 1,962 dps · 1.8s / 130s · 16.6 / 1.2 hits |
| Bow (Slicey) | 477 dps · 1.6s / 125s · 15.1 / 1.7 hits | 593 dps · 1.7s / 127s · 12.8 / 1.5 hits | 720 dps · 2.1s / 138s · 15.2 / 2.5 hits | 821 dps · 2.3s / 139s · 13.9 / 2.1 hits | 955 dps · 2.2s / 117s · 12.1 / 1.3 hits | 1,075 dps · 2.6s / 117s · 13.6 / 1.5 hits | 1,189 dps · 2.1s / 118s · 16.5 / 1.9 hits | 1,302 dps · 2.7s / 196s · 13.1 / 0.9 hits ⚠1-shot |
| Crossbow (Bonk) | 301 dps · 2.6s / 197s · 18.7 / 2.1 hits | 374 dps · 2.6s / 201s · 15.9 / 1.9 hits | 455 dps · 3.3s / 219s · 18.7 / 3.1 hits | 528 dps · 3.6s / 216s · 17.1 / 2.6 hits | 607 dps · 3.4s / 184s · 14.7 / 1.6 hits | 684 dps · 4s / 184s · 16.6 / 1.9 hits | 756 dps · 3.3s / 186s · 20 / 2.3 hits | 829 dps · 4.2s / 307s · 15.8 / 1.1 hits |
| Brain caster: staff spells | 448 dps · 1.7s / 133s · 15.1 / 1.7 hits | 549 dps · 1.8s / 137s · 12.8 / 1.5 hits | 662 dps · 2.3s / 150s · 15.2 / 2.5 hits | 742 dps · 2.6s / 154s · 13.9 / 2.1 hits | 839 dps · 2.5s / 133s · 12.1 / 1.3 hits | 933 dps · 2.9s / 135s · 13.6 / 1.5 hits | 1,020 dps · 2.4s / 138s · 16.5 / 1.9 hits | 1,104 dps · 3.2s / 231s · 13.1 / 0.9 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 820 dps · 1s / 72s · 15.1 / 1.7 hits | 1,011 dps · 1s / 75s · 12.8 / 1.5 hits | 1,226 dps · 1.2s / 81s · 15.2 / 2.5 hits | 1,385 dps · 1.4s / 82s · 13.9 / 2.1 hits | 1,582 dps · 1.3s / 70s · 12.1 / 1.3 hits | 1,776 dps · 1.6s / 71s · 13.6 / 1.5 hits | 1,950 dps · 1.3s / 72s · 16.5 / 1.9 hits | 2,117 dps · 1.6s / 120s · 13.1 / 0.9 hits ⚠1-shot |
| Prayer caster: talisman spells | 315 dps · 2.5s / 189s · 15.4 / 1.7 hits | 389 dps · 2.5s / 194s · 13.1 / 1.6 hits | 473 dps · 3.2s / 210s · 15.4 / 2.6 hits | 535 dps · 3.6s / 213s · 14.2 / 2.1 hits | 613 dps · 3.4s / 182s · 12.3 / 1.3 hits | 690 dps · 4s / 183s · 13.8 / 1.6 hits | 759 dps · 3.2s / 185s · 16.7 / 1.9 hits | 832 dps · 4.2s / 306s · 13.3 / 0.9 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Frost Lance; spells 416 + weapon 32 · Z2 Meteor, Void Rift, Frost Lance; spells 510 + weapon 39 · Z3 Meteor, Void Rift, Frost Lance; spells 615 + weapon 46 · Z4 Meteor, Void Rift, Frost Lance; spells 691 + weapon 51 · Z5 Meteor, Void Rift, Frost Lance; spells 781 + weapon 57 · Z6 Meteor, Void Rift, Frost Lance; spells 871 + weapon 62 · Z7 Meteor, Void Rift, Frost Lance; spells 953 + weapon 67 · Z8 Meteor, Void Rift, Frost Lance; spells 1,030 + weapon 73
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 788 + weapon 33 · Z2 Meteor, Void Rift, Frost Lance; spells 971 + weapon 40 · Z3 Meteor, Void Rift, Frost Lance; spells 1,178 + weapon 48 · Z4 Meteor, Void Rift, Frost Lance; spells 1,332 + weapon 53 · Z5 Meteor, Void Rift, Frost Lance; spells 1,523 + weapon 59 · Z6 Meteor, Void Rift, Frost Lance; spells 1,711 + weapon 64 · Z7 Meteor, Void Rift, Frost Lance; spells 1,881 + weapon 70 · Z8 Meteor, Void Rift, Frost Lance; spells 2,041 + weapon 76
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 178 + weapon 137 · Z2 Sunray, Purify; spells 219 + weapon 170 · Z3 Sunray, Purify; spells 266 + weapon 207 · Z4 Sunray, Purify; spells 300 + weapon 235 · Z5 Sunray, Purify; spells 342 + weapon 271 · Z6 Sunray, Purify; spells 384 + weapon 306 · Z7 Sunray, Purify; spells 421 + weapon 338 · Z8 Sunray, Purify; spells 457 + weapon 375

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 104 | 72 | 197 | 2.7 |
| 2 | 106 | 75 | 201 | 2.7 |
| 3 | 115 | 81 | 219 | 2.7 |
| 4 | 115 | 82 | 216 | 2.6 |
| 5 | 97 | 70 | 184 | 2.6 |
| 6 | 98 | 70 | 184 | 2.6 |
| 7 | 99 | 71 | 186 | 2.6 |
| 8 | 163 | 117 | 307 | 2.6 |

### NG+2

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 2,567 dps · 1.8s / 118s · 20.6 / 2.3 hits | 2,982 dps · 1.8s / 119s · 17 / 2.3 hits | 3,506 dps · 1.7s / 119s · 18.6 / 3.1 hits | 3,811 dps · 1.8s / 118s · 15.8 / 2.4 hits | 4,016 dps · 1.9s / 122s · 12.9 / 1.4 hits | 4,223 dps · 2.4s / 125s · 13.8 / 1.6 hits | 4,433 dps · 2.1s / 125s · 16.3 / 1.9 hits | 4,630 dps · 2.8s / 173s · 12 / 0.8 hits ⚠1-shot |
| Slicey: twin daggers | 2,519 dps · 1.9s / 120s · 17.3 / 1.9 hits | 2,942 dps · 1.8s / 120s · 14.2 / 1.9 hits | 3,433 dps · 1.7s / 121s · 15.7 / 2.6 hits | 3,757 dps · 1.8s / 119s · 13.3 / 2 hits | 3,963 dps · 1.9s / 123s · 10.9 / 1.2 hits | 4,172 dps · 2.4s / 127s · 11.7 / 1.3 hits | 4,394 dps · 2.1s / 127s · 13.7 / 1.6 hits | 4,589 dps · 2.8s / 174s · 10.2 / 0.7 hits ⚠1-shot |
| Quality: greatsword + shield | 2,321 dps · 2s / 130s · 21.6 / 2.4 hits | 2,696 dps · 2s / 131s · 17.8 / 2.4 hits | 3,119 dps · 1.9s / 133s · 19.6 / 3.3 hits | 3,389 dps · 2s / 132s · 16.7 / 2.5 hits | 3,784 dps · 2s / 129s · 13.3 / 1.4 hits | 4,110 dps · 2.5s / 129s · 14.3 / 1.6 hits | 4,396 dps · 2.1s / 126s · 17 / 2 hits | 4,731 dps · 2.7s / 169s · 12.4 / 0.9 hits ⚠1-shot |
| Bow (Slicey) | 1,539 dps · 3.1s / 196s · 17.1 / 1.9 hits | 1,789 dps · 3s / 198s · 14.1 / 1.9 hits | 2,070 dps · 2.9s / 201s · 15.5 / 2.6 hits | 2,251 dps · 3.1s / 199s · 13.2 / 2 hits | 2,371 dps · 3.2s / 206s · 10.7 / 1.1 hits | 2,514 dps · 4s / 210s · 11.5 / 1.3 hits | 2,638 dps · 3.6s / 211s · 13.6 / 1.6 hits | 2,755 dps · 4.7s / 290s · 10.1 / 0.7 hits ⚠1-shot |
| Crossbow (Bonk) | 980 dps · 4.8s / 308s · 20.6 / 2.3 hits | 1,140 dps · 4.6s / 311s · 17 / 2.3 hits | 1,319 dps · 4.5s / 316s · 18.6 / 3.1 hits | 1,435 dps · 4.8s / 313s · 15.8 / 2.4 hits | 1,512 dps · 5s / 324s · 12.9 / 1.4 hits | 1,609 dps · 6.3s / 329s · 13.8 / 1.6 hits | 1,689 dps · 5.6s / 329s · 16.3 / 1.9 hits | 1,764 dps · 7.3s / 453s · 12 / 0.8 hits ⚠1-shot |
| Brain caster: staff spells | 1,292 dps · 3.7s / 234s · 17.1 / 1.9 hits | 1,479 dps · 3.6s / 240s · 14.2 / 1.9 hits | 1,662 dps · 3.6s / 250s · 15.7 / 2.6 hits | 1,743 dps · 4s / 257s · 13.3 / 2 hits | 1,826 dps · 4.1s / 268s · 10.7 / 1.1 hits | 1,908 dps · 5.3s / 277s · 11.5 / 1.3 hits | 1,992 dps · 4.7s / 279s · 13.6 / 1.6 hits | 2,075 dps · 6.2s / 385s · 10.1 / 0.7 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 2,488 dps · 1.9s / 121s · 17.1 / 1.9 hits | 2,855 dps · 1.9s / 124s · 14.2 / 1.9 hits | 3,205 dps · 1.9s / 130s · 15.7 / 2.6 hits | 3,360 dps · 2.1s / 133s · 13.3 / 2 hits | 3,518 dps · 2.2s / 139s · 10.7 / 1.1 hits | 3,673 dps · 2.7s / 144s · 11.5 / 1.3 hits | 3,831 dps · 2.5s / 145s · 13.6 / 1.6 hits | 3,989 dps · 3.2s / 200s · 10.1 / 0.7 hits ⚠1-shot |
| Prayer caster: talisman spells | 980 dps · 4.8s / 308s · 17.3 / 1.9 hits | 1,135 dps · 4.7s / 312s · 14.2 / 1.9 hits | 1,278 dps · 4.7s / 326s · 15.9 / 2.6 hits | 1,343 dps · 5.2s / 334s · 13.5 / 2.1 hits | 1,413 dps · 5.4s / 346s · 10.9 / 1.2 hits | 1,479 dps · 6.8s / 357s · 11.7 / 1.3 hits | 1,550 dps · 6.1s / 359s · 13.7 / 1.6 hits | 1,617 dps · 8s / 494s · 10.2 / 0.7 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Frost Lance; spells 1,206 + weapon 86 · Z2 Meteor, Void Rift, Frost Lance; spells 1,381 + weapon 98 · Z3 Meteor, Void Rift, Frost Lance; spells 1,549 + weapon 112 · Z4 Meteor, Void Rift, Frost Lance; spells 1,624 + weapon 119 · Z5 Meteor, Void Rift, Frost Lance; spells 1,698 + weapon 128 · Z6 Meteor, Void Rift, Frost Lance; spells 1,772 + weapon 136 · Z7 Meteor, Void Rift, Frost Lance; spells 1,846 + weapon 145 · Z8 Meteor, Void Rift, Frost Lance; spells 1,921 + weapon 154
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 2,399 + weapon 89 · Z2 Meteor, Void Rift, Frost Lance; spells 2,753 + weapon 102 · Z3 Meteor, Void Rift, Frost Lance; spells 3,089 + weapon 116 · Z4 Meteor, Void Rift, Frost Lance; spells 3,237 + weapon 124 · Z5 Meteor, Void Rift, Frost Lance; spells 3,385 + weapon 133 · Z6 Meteor, Void Rift, Frost Lance; spells 3,533 + weapon 141 · Z7 Meteor, Void Rift, Frost Lance; spells 3,681 + weapon 150 · Z8 Meteor, Void Rift, Frost Lance; spells 3,829 + weapon 159
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 537 + weapon 443 · Z2 Sunray, Purify; spells 620 + weapon 515 · Z3 Sunray, Purify; spells 696 + weapon 582 · Z4 Sunray, Purify; spells 729 + weapon 614 · Z5 Sunray, Purify; spells 763 + weapon 650 · Z6 Sunray, Purify; spells 796 + weapon 683 · Z7 Sunray, Purify; spells 829 + weapon 720 · Z8 Sunray, Purify; spells 863 + weapon 754

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 163 | 118 | 308 | 2.6 |
| 2 | 165 | 119 | 312 | 2.6 |
| 3 | 167 | 119 | 326 | 2.7 |
| 4 | 166 | 118 | 334 | 2.8 |
| 5 | 173 | 122 | 346 | 2.8 |
| 6 | 177 | 125 | 357 | 2.9 |
| 7 | 178 | 125 | 359 | 2.9 |
| 8 | 245 | 169 | 494 | 2.9 |

### NG+3

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 5,150 dps · 2.4s / 157s · 23.9 / 2.7 hits | 5,681 dps · 1.9s / 156s · 18.9 / 2.6 hits | 6,255 dps · 1.8s / 157s · 19.9 / 3.3 hits | 6,509 dps · 1.9s / 154s · 16.6 / 2.5 hits | 6,765 dps · 2s / 150s · 12.8 / 1.4 hits | 7,040 dps · 2.4s / 147s · 13.3 / 1.5 hits | 7,283 dps · 2.1s / 145s · 15.2 / 1.7 hits | 7,545 dps · 2.7s / 196s · 10.7 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 5,106 dps · 2.4s / 158s · 20.2 / 2.3 hits | 5,635 dps · 1.9s / 157s · 16 / 2.2 hits | 6,226 dps · 1.9s / 158s · 16.8 / 2.8 hits | 6,483 dps · 2s / 154s · 14.1 / 2.2 hits | 6,744 dps · 2s / 151s · 10.9 / 1.2 hits | 7,025 dps · 2.4s / 148s · 11.3 / 1.3 hits | 7,270 dps · 2.1s / 145s · 12.9 / 1.5 hits | 7,537 dps · 2.7s / 196s · 9.1 / 0.6 hits ⚠1-shot |
| Quality: greatsword + shield | 5,355 dps · 2.3s / 151s · 25 / 2.8 hits | 6,047 dps · 1.8s / 146s · 19.8 / 2.7 hits | 6,773 dps · 1.7s / 145s · 20.8 / 3.5 hits | 7,275 dps · 1.7s / 137s · 17.4 / 2.7 hits | 7,853 dps · 1.7s / 129s · 13.5 / 1.4 hits | 8,389 dps · 2s / 124s · 14 / 1.6 hits | 8,903 dps · 1.7s / 119s · 16 / 1.8 hits | 9,409 dps · 2.1s / 157s · 11.3 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 3,061 dps · 4s / 263s · 20 / 2.3 hits | 3,377 dps · 3.2s / 262s · 15.8 / 2.2 hits | 3,716 dps · 3.1s / 264s · 16.7 / 2.8 hits | 3,866 dps · 3.3s / 259s · 13.9 / 2.1 hits | 4,016 dps · 3.3s / 253s · 10.8 / 1.1 hits | 4,177 dps · 4s / 248s · 11.2 / 1.3 hits | 4,320 dps · 3.5s / 244s · 12.8 / 1.5 hits | 4,474 dps · 4.5s / 331s · 9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 1,962 dps · 6.3s / 411s · 23.9 / 2.7 hits | 2,164 dps · 5.1s / 409s · 18.9 / 2.6 hits | 2,382 dps · 4.8s / 412s · 19.9 / 3.3 hits | 2,479 dps · 5.1s / 403s · 16.6 / 2.5 hits | 2,577 dps · 5.2s / 394s · 12.8 / 1.4 hits | 2,681 dps · 6.3s / 387s · 13.3 / 1.5 hits | 2,774 dps · 5.5s / 381s · 15.2 / 1.7 hits | 2,873 dps · 7s / 515s · 10.7 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 2,295 dps · 5.4s / 351s · 20.2 / 2.3 hits | 2,525 dps · 4.3s / 350s · 15.8 / 2.2 hits | 2,767 dps · 4.2s / 355s · 16.7 / 2.8 hits | 2,868 dps · 4.4s / 349s · 13.9 / 2.1 hits | 2,969 dps · 4.5s / 342s · 10.8 / 1.1 hits | 3,068 dps · 5.5s / 338s · 11.3 / 1.3 hits | 3,171 dps · 4.8s / 333s · 12.8 / 1.5 hits | 3,271 dps · 6.2s / 452s · 9 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 4,410 dps · 2.8s / 183s · 20.2 / 2.3 hits | 4,851 dps · 2.3s / 182s · 15.8 / 2.2 hits | 5,312 dps · 2.2s / 185s · 16.7 / 2.8 hits | 5,501 dps · 2.3s / 182s · 13.9 / 2.1 hits | 5,691 dps · 2.4s / 179s · 10.8 / 1.1 hits | 5,879 dps · 2.9s / 177s · 11.3 / 1.3 hits | 6,070 dps · 2.5s / 174s · 12.8 / 1.5 hits | 6,258 dps · 3.2s / 236s · 9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 1,798 dps · 6.8s / 448s · 20.4 / 2.3 hits | 1,983 dps · 5.5s / 446s · 16 / 2.2 hits | 2,176 dps · 5.3s / 451s · 16.8 / 2.8 hits | 2,264 dps · 5.6s / 442s · 14.1 / 2.2 hits | 2,351 dps · 5.7s / 432s · 10.9 / 1.2 hits | 2,434 dps · 6.9s / 426s · 11.4 / 1.3 hits | 2,523 dps · 6s / 418s · 12.9 / 1.5 hits | 2,606 dps · 7.7s / 568s · 9.1 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Frost Lance; spells 2,122 + weapon 172 · Z2 Meteor, Void Rift, Frost Lance; spells 2,333 + weapon 192 · Z3 Meteor, Void Rift, Frost Lance; spells 2,554 + weapon 213 · Z4 Meteor, Void Rift, Frost Lance; spells 2,642 + weapon 225 · Z5 Meteor, Void Rift, Frost Lance; spells 2,731 + weapon 238 · Z6 Meteor, Void Rift, Frost Lance; spells 2,820 + weapon 249 · Z7 Meteor, Void Rift, Frost Lance; spells 2,908 + weapon 263 · Z8 Meteor, Void Rift, Frost Lance; spells 2,997 + weapon 274
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 4,231 + weapon 178 · Z2 Meteor, Void Rift, Frost Lance; spells 4,652 + weapon 199 · Z3 Meteor, Void Rift, Frost Lance; spells 5,092 + weapon 220 · Z4 Meteor, Void Rift, Frost Lance; spells 5,268 + weapon 233 · Z5 Meteor, Void Rift, Frost Lance; spells 5,445 + weapon 247 · Z6 Meteor, Void Rift, Frost Lance; spells 5,621 + weapon 258 · Z7 Meteor, Void Rift, Frost Lance; spells 5,798 + weapon 273 · Z8 Meteor, Void Rift, Frost Lance; spells 5,974 + weapon 284
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 953 + weapon 845 · Z2 Sunray, Purify; spells 1,048 + weapon 935 · Z3 Sunray, Purify; spells 1,147 + weapon 1,029 · Z4 Sunray, Purify; spells 1,187 + weapon 1,077 · Z5 Sunray, Purify; spells 1,227 + weapon 1,125 · Z6 Sunray, Purify; spells 1,266 + weapon 1,168 · Z7 Sunray, Purify; spells 1,306 + weapon 1,217 · Z8 Sunray, Purify; spells 1,346 + weapon 1,261

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 223 | 151 | 448 | 3 |
| 2 | 222 | 146 | 446 | 3 |
| 3 | 225 | 145 | 451 | 3.1 |
| 4 | 220 | 137 | 442 | 3.2 |
| 5 | 216 | 129 | 432 | 3.3 |
| 6 | 212 | 124 | 426 | 3.4 |
| 7 | 209 | 119 | 418 | 3.5 |
| 8 | 283 | 157 | 568 | 3.6 |

### NG+4

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 8,227 dps · 2.3s / 176s · 25.6 / 2.9 hits | 8,939 dps · 1.9s / 179s · 19.4 / 2.7 hits | 9,682 dps · 1.8s / 182s · 19.7 / 3.3 hits | 9,994 dps · 2s / 182s · 15.8 / 2.4 hits | 10,448 dps · 2s / 178s · 11.7 / 1.2 hits | 10,769 dps · 2.5s / 178s · 12 / 1.4 hits | 11,092 dps · 2.1s / 177s · 13.4 / 1.5 hits | 11,417 dps · 2.8s / 243s · 9.4 / 0.6 hits ⚠1-shot |
| Slicey: twin daggers | 8,245 dps · 2.3s / 175s · 21.8 / 2.5 hits | 8,941 dps · 1.9s / 179s · 16.9 / 2.3 hits | 9,717 dps · 1.8s / 182s · 17.3 / 2.9 hits | 10,037 dps · 2s / 182s · 13.9 / 2.1 hits | 10,386 dps · 2s / 179s · 10.3 / 1.1 hits | 10,711 dps · 2.5s / 179s · 10.5 / 1.2 hits | 11,039 dps · 2.1s / 178s · 11.8 / 1.4 hits | 11,369 dps · 2.8s / 244s · 8.3 / 0.6 hits ⚠1-shot |
| Quality: greatsword + shield | 10,412 dps · 1.9s / 139s · 27.3 / 3.1 hits | 11,562 dps · 1.5s / 138s · 20.9 / 2.9 hits | 12,701 dps · 1.4s / 139s · 21.3 / 3.6 hits | 13,479 dps · 1.5s / 135s · 17.1 / 2.6 hits | 14,378 dps · 1.4s / 129s · 12.6 / 1.3 hits | 15,261 dps · 1.7s / 126s · 12.9 / 1.5 hits | 15,988 dps · 1.5s / 123s · 14.5 / 1.7 hits | 16,560 dps · 1.9s / 167s · 10.2 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 4,877 dps · 4s / 296s · 21.6 / 2.5 hits | 5,286 dps · 3.3s / 303s · 16.8 / 2.3 hits | 5,723 dps · 3.1s / 309s · 17.3 / 2.9 hits | 5,918 dps · 3.4s / 308s · 13.9 / 2.1 hits | 6,156 dps · 3.4s / 302s · 10.3 / 1.1 hits | 6,343 dps · 4.2s / 302s · 10.5 / 1.2 hits | 6,531 dps · 3.6s / 301s · 11.8 / 1.4 hits | 6,720 dps · 4.7s / 412s · 8.3 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 3,133 dps · 6.2s / 461s · 25.6 / 2.9 hits | 3,404 dps · 5.1s / 470s · 19.4 / 2.7 hits | 3,687 dps · 4.8s / 479s · 19.7 / 3.3 hits | 3,805 dps · 5.3s / 479s · 15.8 / 2.4 hits | 3,933 dps · 5.3s / 473s · 11.7 / 1.2 hits | 4,054 dps · 6.6s / 473s · 12 / 1.4 hits | 4,175 dps · 5.6s / 471s · 13.4 / 1.5 hits | 4,297 dps · 7.4s / 644s · 9.4 / 0.6 hits ⚠1-shot |
| Brain caster: staff spells | 3,551 dps · 5.4s / 407s · 21.8 / 2.5 hits | 3,842 dps · 4.5s / 416s · 16.9 / 2.3 hits | 4,146 dps · 4.3s / 426s · 17.3 / 2.9 hits | 4,268 dps · 4.7s / 427s · 13.9 / 2.1 hits | 4,384 dps · 4.7s / 424s · 10.3 / 1.1 hits | 4,505 dps · 5.9s / 425s · 10.5 / 1.2 hits | 4,621 dps · 5.1s / 425s · 11.8 / 1.4 hits | 4,741 dps · 6.7s / 584s · 8.3 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 6,791 dps · 2.8s / 213s · 21.8 / 2.5 hits | 7,345 dps · 2.4s / 218s · 16.9 / 2.3 hits | 7,921 dps · 2.2s / 223s · 17.3 / 2.9 hits | 8,146 dps · 2.5s / 224s · 13.9 / 2.1 hits | 8,364 dps · 2.5s / 222s · 10.3 / 1.1 hits | 8,588 dps · 3.1s / 223s · 10.5 / 1.2 hits | 8,807 dps · 2.7s / 223s · 11.8 / 1.4 hits | 9,030 dps · 3.5s / 307s · 8.3 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 2,833 dps · 6.8s / 510s · 22 / 2.5 hits | 3,070 dps · 5.6s / 521s · 17 / 2.3 hits | 3,338 dps · 5.3s / 529s · 17.3 / 2.9 hits | 3,442 dps · 5.8s / 530s · 13.9 / 2.1 hits | 3,541 dps · 5.8s / 526s · 10.3 / 1.1 hits | 3,646 dps · 7.3s / 525s · 10.5 / 1.2 hits | 3,745 dps · 6.3s / 525s · 11.8 / 1.4 hits | 3,852 dps · 8.3s / 719s · 8.3 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Frost Lance; spells 3,251 + weapon 301 · Z2 Meteor, Void Rift, Frost Lance; spells 3,514 + weapon 328 · Z3 Meteor, Void Rift, Frost Lance; spells 3,786 + weapon 360 · Z4 Meteor, Void Rift, Frost Lance; spells 3,889 + weapon 379 · Z5 Meteor, Void Rift, Frost Lance; spells 3,992 + weapon 392 · Z6 Meteor, Void Rift, Frost Lance; spells 4,094 + weapon 410 · Z7 Meteor, Void Rift, Frost Lance; spells 4,197 + weapon 424 · Z8 Meteor, Void Rift, Frost Lance; spells 4,300 + weapon 441
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 6,480 + weapon 312 · Z2 Meteor, Void Rift, Frost Lance; spells 7,005 + weapon 340 · Z3 Meteor, Void Rift, Frost Lance; spells 7,549 + weapon 373 · Z4 Meteor, Void Rift, Frost Lance; spells 7,753 + weapon 392 · Z5 Meteor, Void Rift, Frost Lance; spells 7,958 + weapon 406 · Z6 Meteor, Void Rift, Frost Lance; spells 8,163 + weapon 425 · Z7 Meteor, Void Rift, Frost Lance; spells 8,368 + weapon 439 · Z8 Meteor, Void Rift, Frost Lance; spells 8,572 + weapon 457
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,460 + weapon 1,374 · Z2 Sunray, Purify; spells 1,578 + weapon 1,491 · Z3 Sunray, Purify; spells 1,701 + weapon 1,637 · Z4 Sunray, Purify; spells 1,747 + weapon 1,696 · Z5 Sunray, Purify; spells 1,793 + weapon 1,748 · Z6 Sunray, Purify; spells 1,839 + weapon 1,807 · Z7 Sunray, Purify; spells 1,885 + weapon 1,860 · Z8 Sunray, Purify; spells 1,931 + weapon 1,920

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 254 | 139 | 510 | 3.7 |
| 2 | 260 | 138 | 521 | 3.8 |
| 3 | 266 | 139 | 529 | 3.8 |
| 4 | 266 | 135 | 530 | 3.9 |
| 5 | 262 | 129 | 526 | 4.1 |
| 6 | 263 | 126 | 525 | 4.2 |
| 7 | 262 | 123 | 525 | 4.3 |
| 8 | 359 | 167 | 719 | 4.3 |

### NG+5

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 11,719 dps · 2s / 173s · 26.1 / 3 hits | 12,048 dps · 1.8s / 189s · 19 / 2.6 hits | 12,352 dps · 1.8s / 206s · 19 / 3.2 hits | 12,711 dps · 2s / 207s · 15.6 / 2.4 hits | 13,045 dps · 2s / 206s · 11.7 / 1.2 hits | 13,436 dps · 2.4s / 205s · 12.2 / 1.4 hits | 13,747 dps · 2.2s / 205s · 13.9 / 1.6 hits | 14,088 dps · 2.8s / 283s · 9.7 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 11,701 dps · 2s / 173s · 22.9 / 2.6 hits | 12,036 dps · 1.8s / 190s · 16.7 / 2.3 hits | 12,344 dps · 1.8s / 206s · 16.7 / 2.8 hits | 12,712 dps · 2s / 207s · 13.7 / 2.1 hits | 13,054 dps · 2s / 206s · 10.3 / 1.1 hits | 13,459 dps · 2.4s / 205s · 10.7 / 1.2 hits | 13,775 dps · 2.2s / 205s · 12.2 / 1.4 hits | 14,092 dps · 2.8s / 283s · 8.5 / 0.6 hits ⚠1-shot |
| Quality: greatsword + shield | 16,997 dps · 1.4s / 119s · 28.2 / 3.2 hits | 17,472 dps · 1.2s / 131s · 20.6 / 2.8 hits | 17,913 dps · 1.3s / 142s · 20.5 / 3.4 hits | 18,466 dps · 1.4s / 143s · 16.8 / 2.6 hits | 18,949 dps · 1.4s / 142s · 12.6 / 1.3 hits | 19,510 dps · 1.7s / 141s · 13.2 / 1.5 hits | 19,923 dps · 1.5s / 142s · 15 / 1.7 hits | 20,414 dps · 2s / 195s · 10.5 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 6,897 dps · 3.4s / 294s · 22.9 / 2.6 hits | 7,087 dps · 3.1s / 322s · 16.7 / 2.3 hits | 7,265 dps · 3.1s / 350s · 16.7 / 2.8 hits | 7,472 dps · 3.4s / 352s · 13.7 / 2.1 hits | 7,666 dps · 3.4s / 351s · 10.3 / 1.1 hits | 7,890 dps · 4.2s / 350s · 10.7 / 1.2 hits | 8,072 dps · 3.7s / 350s · 12.2 / 1.4 hits | 8,269 dps · 4.8s / 481s · 8.5 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 4,411 dps · 5.3s / 459s · 26.1 / 3 hits | 4,534 dps · 4.8s / 503s · 19 / 2.6 hits | 4,690 dps · 4.8s / 543s · 19 / 3.2 hits | 4,825 dps · 5.3s / 546s · 15.6 / 2.4 hits | 4,952 dps · 5.3s / 543s · 11.7 / 1.2 hits | 5,100 dps · 6.4s / 541s · 12.2 / 1.4 hits | 5,218 dps · 5.7s / 541s · 13.9 / 1.6 hits | 5,347 dps · 7.5s / 745s · 9.7 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 4,858 dps · 4.8s / 417s · 22.9 / 2.6 hits | 4,978 dps · 4.4s / 458s · 16.7 / 2.3 hits | 5,092 dps · 4.4s / 500s · 16.7 / 2.8 hits | 5,213 dps · 4.9s / 505s · 13.7 / 2.1 hits | 5,334 dps · 4.9s / 504s · 10.3 / 1.1 hits | 5,459 dps · 6s / 505s · 10.7 / 1.2 hits | 5,577 dps · 5.3s / 506s · 12.2 / 1.4 hits | 5,695 dps · 7s / 699s · 8.5 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 9,249 dps · 2.5s / 219s · 22.9 / 2.6 hits | 9,472 dps · 2.3s / 241s · 16.7 / 2.3 hits | 9,688 dps · 2.3s / 263s · 16.7 / 2.8 hits | 9,912 dps · 2.6s / 266s · 13.7 / 2.1 hits | 10,136 dps · 2.6s / 265s · 10.3 / 1.1 hits | 10,364 dps · 3.2s / 266s · 10.7 / 1.2 hits | 10,584 dps · 2.8s / 267s · 12.2 / 1.4 hits | 10,805 dps · 3.7s / 368s · 8.5 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 3,952 dps · 5.9s / 513s · 22.9 / 2.6 hits | 4,059 dps · 5.4s / 562s · 16.7 / 2.3 hits | 4,152 dps · 5.4s / 613s · 16.7 / 2.8 hits | 4,261 dps · 6s / 618s · 13.7 / 2.1 hits | 4,369 dps · 6s / 616s · 10.3 / 1.1 hits | 4,486 dps · 7.3s / 615s · 10.7 / 1.2 hits | 4,589 dps · 6.5s / 615s · 12.2 / 1.4 hits | 4,691 dps · 8.5s / 849s · 8.5 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Frost Lance; spells 4,403 + weapon 455 · Z2 Meteor, Void Rift, Frost Lance; spells 4,506 + weapon 473 · Z3 Meteor, Void Rift, Frost Lance; spells 4,608 + weapon 484 · Z4 Meteor, Void Rift, Frost Lance; spells 4,711 + weapon 502 · Z5 Meteor, Void Rift, Frost Lance; spells 4,814 + weapon 520 · Z6 Meteor, Void Rift, Frost Lance; spells 4,916 + weapon 542 · Z7 Meteor, Void Rift, Frost Lance; spells 5,019 + weapon 558 · Z8 Meteor, Void Rift, Frost Lance; spells 5,122 + weapon 573
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 8,777 + weapon 472 · Z2 Meteor, Void Rift, Frost Lance; spells 8,982 + weapon 490 · Z3 Meteor, Void Rift, Frost Lance; spells 9,187 + weapon 501 · Z4 Meteor, Void Rift, Frost Lance; spells 9,392 + weapon 520 · Z5 Meteor, Void Rift, Frost Lance; spells 9,596 + weapon 539 · Z6 Meteor, Void Rift, Frost Lance; spells 9,801 + weapon 562 · Z7 Meteor, Void Rift, Frost Lance; spells 10,006 + weapon 578 · Z8 Meteor, Void Rift, Frost Lance; spells 10,211 + weapon 594
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,977 + weapon 1,974 · Z2 Sunray, Purify; spells 2,024 + weapon 2,035 · Z3 Sunray, Purify; spells 2,070 + weapon 2,082 · Z4 Sunray, Purify; spells 2,116 + weapon 2,145 · Z5 Sunray, Purify; spells 2,162 + weapon 2,207 · Z6 Sunray, Purify; spells 2,208 + weapon 2,278 · Z7 Sunray, Purify; spells 2,254 + weapon 2,334 · Z8 Sunray, Purify; spells 2,300 + weapon 2,391

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 256 | 119 | 513 | 4.3 |
| 2 | 281 | 131 | 562 | 4.3 |
| 3 | 307 | 142 | 613 | 4.3 |
| 4 | 309 | 143 | 618 | 4.3 |
| 5 | 308 | 142 | 616 | 4.3 |
| 6 | 308 | 141 | 615 | 4.3 |
| 7 | 308 | 142 | 615 | 4.3 |
| 8 | 425 | 195 | 849 | 4.4 |

### NG+6

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 14,430 dps · 1.9s / 193s · 27.1 / 3.1 hits | 14,718 dps · 1.8s / 211s · 19.8 / 2.7 hits | 15,005 dps · 1.8s / 232s · 19.7 / 3.3 hits | 15,292 dps · 2s / 234s · 16.1 / 2.5 hits | 15,580 dps · 2s / 235s · 12 / 1.3 hits | 15,867 dps · 2.5s / 237s · 12.5 / 1.4 hits | 16,154 dps · 2.2s / 238s · 14.2 / 1.6 hits | 16,442 dps · 2.9s / 329s · 9.8 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 14,378 dps · 1.9s / 194s · 23.9 / 2.7 hits | 14,664 dps · 1.8s / 212s · 17.4 / 2.4 hits | 14,951 dps · 1.8s / 232s · 17.3 / 2.9 hits | 15,237 dps · 2s / 235s · 14.1 / 2.2 hits | 15,523 dps · 2s / 236s · 10.5 / 1.1 hits | 15,809 dps · 2.5s / 238s · 11 / 1.2 hits | 16,096 dps · 2.2s / 239s · 12.5 / 1.4 hits | 16,382 dps · 3s / 330s · 8.7 / 0.6 hits ⚠1-shot |
| Quality: greatsword + shield | 20,829 dps · 1.3s / 134s · 29.3 / 3.3 hits | 21,243 dps · 1.3s / 146s · 21.4 / 2.9 hits | 21,658 dps · 1.3s / 160s · 21.3 / 3.6 hits | 22,073 dps · 1.4s / 162s · 17.4 / 2.7 hits | 22,487 dps · 1.4s / 163s · 13 / 1.4 hits | 22,902 dps · 1.7s / 164s · 13.5 / 1.5 hits | 23,317 dps · 1.5s / 165s · 15.4 / 1.8 hits | 23,732 dps · 2s / 228s · 10.6 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 8,452 dps · 3.3s / 330s · 23.9 / 2.7 hits | 8,620 dps · 3.1s / 360s · 17.4 / 2.4 hits | 8,788 dps · 3.1s / 395s · 17.3 / 2.9 hits | 8,957 dps · 3.5s / 399s · 14.1 / 2.2 hits | 9,125 dps · 3.4s / 401s · 10.5 / 1.1 hits | 9,293 dps · 4.3s / 405s · 11 / 1.2 hits | 9,461 dps · 3.8s / 406s · 12.5 / 1.4 hits | 9,630 dps · 5s / 562s · 8.7 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 5,477 dps · 5.1s / 509s · 27.1 / 3.1 hits | 5,586 dps · 4.8s / 555s · 19.8 / 2.7 hits | 5,695 dps · 4.8s / 610s · 19.7 / 3.3 hits | 5,804 dps · 5.4s / 616s · 16.1 / 2.5 hits | 5,913 dps · 5.3s / 619s · 12 / 1.3 hits | 6,022 dps · 6.6s / 625s · 12.5 / 1.4 hits | 6,131 dps · 5.8s / 626s · 14.2 / 1.6 hits | 6,240 dps · 7.8s / 867s · 9.8 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 5,813 dps · 4.8s / 480s · 23.9 / 2.7 hits | 5,932 dps · 4.5s / 523s · 17.4 / 2.4 hits | 6,058 dps · 4.5s / 574s · 17.3 / 2.9 hits | 6,177 dps · 5.1s / 579s · 14.1 / 2.2 hits | 6,306 dps · 5s / 580s · 10.5 / 1.1 hits | 6,425 dps · 6.2s / 586s · 11 / 1.2 hits | 6,549 dps · 5.4s / 586s · 12.5 / 1.4 hits | 6,669 dps · 7.3s / 812s · 8.7 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 11,026 dps · 2.5s / 253s · 23.9 / 2.7 hits | 11,247 dps · 2.4s / 276s · 17.4 / 2.4 hits | 11,476 dps · 2.4s / 303s · 17.3 / 2.9 hits | 11,697 dps · 2.7s / 306s · 14.1 / 2.2 hits | 11,930 dps · 2.6s / 307s · 10.5 / 1.1 hits | 12,152 dps · 3.3s / 310s · 11 / 1.2 hits | 12,378 dps · 2.9s / 310s · 12.5 / 1.4 hits | 12,600 dps · 3.8s / 429s · 8.7 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 4,794 dps · 5.8s / 582s · 23.9 / 2.7 hits | 4,897 dps · 5.5s / 633s · 17.4 / 2.4 hits | 5,017 dps · 5.4s / 693s · 17.3 / 2.9 hits | 5,121 dps · 6.1s / 699s · 14.1 / 2.2 hits | 5,242 dps · 6s / 698s · 10.5 / 1.1 hits | 5,362 dps · 7.5s / 702s · 11 / 1.2 hits | 5,476 dps · 6.5s / 701s · 12.5 / 1.4 hits | 5,581 dps · 8.7s / 970s · 8.7 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Frost Lance; spells 5,225 + weapon 588 · Z2 Meteor, Void Rift, Frost Lance; spells 5,327 + weapon 604 · Z3 Meteor, Void Rift, Frost Lance; spells 5,430 + weapon 628 · Z4 Meteor, Void Rift, Frost Lance; spells 5,533 + weapon 644 · Z5 Meteor, Void Rift, Frost Lance; spells 5,636 + weapon 671 · Z6 Meteor, Void Rift, Frost Lance; spells 5,738 + weapon 687 · Z7 Meteor, Void Rift, Frost Lance; spells 5,841 + weapon 708 · Z8 Meteor, Void Rift, Frost Lance; spells 5,944 + weapon 725
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 10,416 + weapon 610 · Z2 Meteor, Void Rift, Frost Lance; spells 10,621 + weapon 626 · Z3 Meteor, Void Rift, Frost Lance; spells 10,825 + weapon 650 · Z4 Meteor, Void Rift, Frost Lance; spells 11,030 + weapon 667 · Z5 Meteor, Void Rift, Frost Lance; spells 11,235 + weapon 695 · Z6 Meteor, Void Rift, Frost Lance; spells 11,440 + weapon 712 · Z7 Meteor, Void Rift, Frost Lance; spells 11,645 + weapon 734 · Z8 Meteor, Void Rift, Frost Lance; spells 11,849 + weapon 751
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,347 + weapon 2,447 · Z2 Sunray, Purify; spells 2,393 + weapon 2,504 · Z3 Sunray, Purify; spells 2,439 + weapon 2,578 · Z4 Sunray, Purify; spells 2,485 + weapon 2,636 · Z5 Sunray, Purify; spells 2,531 + weapon 2,711 · Z6 Sunray, Purify; spells 2,577 + weapon 2,784 · Z7 Sunray, Purify; spells 2,623 + weapon 2,852 · Z8 Sunray, Purify; spells 2,670 + weapon 2,912

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 292 | 134 | 582 | 4.3 |
| 2 | 318 | 146 | 633 | 4.3 |
| 3 | 349 | 160 | 693 | 4.3 |
| 4 | 353 | 162 | 699 | 4.3 |
| 5 | 354 | 163 | 698 | 4.3 |
| 6 | 357 | 164 | 702 | 4.3 |
| 7 | 358 | 165 | 701 | 4.3 |
| 8 | 496 | 228 | 970 | 4.3 |

### NG+7

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 16,729 dps · 2s / 221s · 28.8 / 3.3 hits | 17,016 dps · 1.8s / 242s · 21 / 2.9 hits | 17,304 dps · 1.9s / 264s · 20.8 / 3.5 hits | 17,591 dps · 2.1s / 267s · 16.9 / 2.6 hits | 17,878 dps · 2.1s / 267s · 12.6 / 1.3 hits | 18,166 dps · 2.6s / 269s · 13.1 / 1.5 hits | 18,453 dps · 2.3s / 270s · 14.9 / 1.7 hits | 18,740 dps · 3s / 373s · 10.3 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 16,668 dps · 2s / 221s · 25.3 / 2.9 hits | 16,955 dps · 1.8s / 242s · 18.4 / 2.5 hits | 17,241 dps · 1.9s / 265s · 18.3 / 3.1 hits | 17,527 dps · 2.1s / 268s · 14.9 / 2.3 hits | 17,813 dps · 2.1s / 268s · 11.1 / 1.2 hits | 18,100 dps · 2.6s / 270s · 11.5 / 1.3 hits | 18,386 dps · 2.3s / 271s · 13.1 / 1.5 hits | 18,672 dps · 3s / 374s · 9 / 0.6 hits ⚠1-shot |
| Quality: greatsword + shield | 24,146 dps · 1.4s / 153s · 31.2 / 3.6 hits | 24,561 dps · 1.3s / 167s · 22.7 / 3.1 hits | 24,976 dps · 1.3s / 183s · 22.5 / 3.8 hits | 25,391 dps · 1.4s / 185s · 18.3 / 2.8 hits | 25,805 dps · 1.4s / 185s · 13.6 / 1.4 hits | 26,220 dps · 1.8s / 186s · 14.1 / 1.6 hits | 26,635 dps · 1.6s / 187s · 16.1 / 1.9 hits | 27,049 dps · 2.1s / 258s · 11.1 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 9,798 dps · 3.4s / 377s · 25.3 / 2.9 hits | 9,966 dps · 3.1s / 412s · 18.4 / 2.5 hits | 10,135 dps · 3.2s / 451s · 18.3 / 3.1 hits | 10,303 dps · 3.5s / 455s · 14.9 / 2.3 hits | 10,471 dps · 3.6s / 456s · 11.1 / 1.2 hits | 10,639 dps · 4.4s / 459s · 11.5 / 1.3 hits | 10,808 dps · 3.9s / 461s · 13.1 / 1.5 hits | 10,976 dps · 5.1s / 636s · 9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 6,349 dps · 5.2s / 581s · 28.8 / 3.3 hits | 6,458 dps · 4.8s / 636s · 21 / 2.9 hits | 6,567 dps · 4.9s / 696s · 20.8 / 3.5 hits | 6,676 dps · 5.4s / 703s · 16.9 / 2.6 hits | 6,785 dps · 5.5s / 704s · 12.6 / 1.3 hits | 6,894 dps · 6.9s / 709s · 13.1 / 1.5 hits | 7,003 dps · 6s / 711s · 14.9 / 1.7 hits | 7,112 dps · 7.9s / 982s · 10.3 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 6,788 dps · 4.9s / 544s · 25.3 / 2.9 hits | 6,912 dps · 4.5s / 595s · 18.4 / 2.5 hits | 7,037 dps · 4.6s / 650s · 18.3 / 3.1 hits | 7,157 dps · 5.1s / 655s · 14.9 / 2.3 hits | 7,286 dps · 5.1s / 656s · 11.1 / 1.2 hits | 7,411 dps · 6.4s / 659s · 11.5 / 1.3 hits | 7,532 dps · 5.6s / 661s · 13.1 / 1.5 hits | 7,648 dps · 7.3s / 913s · 9 / 0.6 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 12,823 dps · 2.6s / 288s · 25.3 / 2.9 hits | 13,050 dps · 2.4s / 315s · 18.4 / 2.5 hits | 13,277 dps · 2.4s / 344s · 18.3 / 3.1 hits | 13,500 dps · 2.7s / 347s · 14.9 / 2.3 hits | 13,732 dps · 2.7s / 348s · 11.1 / 1.2 hits | 13,960 dps · 3.4s / 350s · 11.5 / 1.3 hits | 14,184 dps · 3s / 351s · 13.1 / 1.5 hits | 14,402 dps · 3.9s / 485s · 9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 5,687 dps · 5.8s / 649s · 25.3 / 2.9 hits | 5,803 dps · 5.4s / 708s · 18.4 / 2.5 hits | 5,919 dps · 5.5s / 773s · 18.3 / 3.1 hits | 6,026 dps · 6s / 779s · 14.9 / 2.3 hits | 6,152 dps · 6.1s / 777s · 11.1 / 1.2 hits | 6,269 dps · 7.6s / 780s · 11.5 / 1.3 hits | 6,367 dps · 6.6s / 782s · 13.1 / 1.5 hits | 6,466 dps · 8.7s / 1,080s · 9 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Frost Lance; spells 6,046 + weapon 742 · Z2 Meteor, Void Rift, Frost Lance; spells 6,149 + weapon 763 · Z3 Meteor, Void Rift, Frost Lance; spells 6,252 + weapon 785 · Z4 Meteor, Void Rift, Frost Lance; spells 6,355 + weapon 802 · Z5 Meteor, Void Rift, Frost Lance; spells 6,457 + weapon 829 · Z6 Meteor, Void Rift, Frost Lance; spells 6,560 + weapon 851 · Z7 Meteor, Void Rift, Frost Lance; spells 6,663 + weapon 869 · Z8 Meteor, Void Rift, Frost Lance; spells 6,766 + weapon 883
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 12,054 + weapon 769 · Z2 Meteor, Void Rift, Frost Lance; spells 12,259 + weapon 791 · Z3 Meteor, Void Rift, Frost Lance; spells 12,464 + weapon 813 · Z4 Meteor, Void Rift, Frost Lance; spells 12,669 + weapon 831 · Z5 Meteor, Void Rift, Frost Lance; spells 12,873 + weapon 859 · Z6 Meteor, Void Rift, Frost Lance; spells 13,078 + weapon 882 · Z7 Meteor, Void Rift, Frost Lance; spells 13,283 + weapon 901 · Z8 Meteor, Void Rift, Frost Lance; spells 13,488 + weapon 915
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,716 + weapon 2,972 · Z2 Sunray, Purify; spells 2,762 + weapon 3,041 · Z3 Sunray, Purify; spells 2,808 + weapon 3,111 · Z4 Sunray, Purify; spells 2,854 + weapon 3,172 · Z5 Sunray, Purify; spells 2,900 + weapon 3,251 · Z6 Sunray, Purify; spells 2,946 + weapon 3,322 · Z7 Sunray, Purify; spells 2,993 + weapon 3,375 · Z8 Sunray, Purify; spells 3,039 + weapon 3,428

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 332 | 153 | 649 | 4.2 |
| 2 | 364 | 167 | 708 | 4.2 |
| 3 | 398 | 183 | 773 | 4.2 |
| 4 | 401 | 185 | 779 | 4.2 |
| 5 | 402 | 185 | 777 | 4.2 |
| 6 | 405 | 186 | 780 | 4.2 |
| 7 | 406 | 187 | 782 | 4.2 |
| 8 | 561 | 258 | 1,080 | 4.2 |

### NG+10

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 23,625 dps · 2.4s / 258s · 11.7 / 1.3 hits | 23,912 dps · 2.2s / 284s · 8.5 / 1.2 hits | 24,200 dps · 2.2s / 312s · 8.3 / 1.4 hits | 24,487 dps · 2.4s / 316s · 6.8 / 1 hits | 24,774 dps · 2.5s / 318s · 5 / 0.5 hits ⚠1-shot | 25,062 dps · 3.1s / 322s · 5.2 / 0.6 hits ⚠1-shot | 25,349 dps · 2.7s / 324s · 5.9 / 0.7 hits ⚠1-shot | 25,636 dps · 3.6s / 450s · 4 / 0.3 hits ⚠1-shot |
| Slicey: twin daggers | 23,539 dps · 2.4s / 259s · 10.3 / 1.2 hits | 23,825 dps · 2.2s / 285s · 7.4 / 1 hits | 24,112 dps · 2.2s / 313s · 7.3 / 1.2 hits | 24,398 dps · 2.4s / 317s · 5.9 / 0.9 hits ⚠1-shot | 24,684 dps · 2.5s / 320s · 4.4 / 0.5 hits ⚠1-shot | 24,971 dps · 3.1s / 323s · 4.5 / 0.5 hits ⚠1-shot | 25,257 dps · 2.8s / 325s · 5.2 / 0.6 hits ⚠1-shot | 25,543 dps · 3.6s / 451s · 3.5 / 0.2 hits ⚠1-shot |
| Quality: greatsword + shield | 34,100 dps · 1.7s / 179s · 12.6 / 1.4 hits | 34,515 dps · 1.5s / 197s · 9.1 / 1.3 hits | 34,929 dps · 1.5s / 216s · 9 / 1.5 hits | 35,344 dps · 1.7s / 219s · 7.3 / 1.1 hits | 35,759 dps · 1.7s / 221s · 5.4 / 0.6 hits ⚠1-shot | 36,173 dps · 2.2s / 223s · 5.6 / 0.6 hits ⚠1-shot | 36,588 dps · 1.9s / 225s · 6.3 / 0.7 hits ⚠1-shot | 37,003 dps · 2.5s / 311s · 4.3 / 0.3 hits ⚠1-shot |
| Bow (Slicey) | 13,837 dps · 4.1s / 441s · 10.3 / 1.2 hits | 14,005 dps · 3.7s / 484s · 7.4 / 1 hits | 14,173 dps · 3.8s / 533s · 7.3 / 1.2 hits | 14,342 dps · 4.2s / 540s · 5.9 / 0.9 hits ⚠1-shot | 14,510 dps · 4.2s / 544s · 4.4 / 0.5 hits ⚠1-shot | 14,678 dps · 5.3s / 550s · 4.5 / 0.5 hits ⚠1-shot | 14,847 dps · 4.7s / 553s · 5.2 / 0.6 hits ⚠1-shot | 15,015 dps · 6.2s / 768s · 3.5 / 0.2 hits ⚠1-shot |
| Crossbow (Bonk) | 8,966 dps · 6.3s / 680s · 11.7 / 1.3 hits | 9,075 dps · 5.7s / 748s · 8.5 / 1.2 hits | 9,184 dps · 5.8s / 822s · 8.3 / 1.4 hits | 9,293 dps · 6.4s / 833s · 6.8 / 1 hits | 9,402 dps · 6.6s / 839s · 5 / 0.5 hits ⚠1-shot | 9,511 dps · 8.2s / 848s · 5.2 / 0.6 hits ⚠1-shot | 9,620 dps · 7.2s / 854s · 5.9 / 0.7 hits ⚠1-shot | 9,729 dps · 9.5s / 1,185s · 4 / 0.3 hits ⚠1-shot |
| Brain caster: staff spells | 9,625 dps · 5.9s / 634s · 10.3 / 1.2 hits | 9,741 dps · 5.3s / 696s · 7.4 / 1 hits | 9,857 dps · 5.4s / 766s · 7.3 / 1.2 hits | 9,973 dps · 6s / 776s · 5.9 / 0.9 hits ⚠1-shot | 10,090 dps · 6.1s / 782s · 4.4 / 0.5 hits ⚠1-shot | 10,206 dps · 7.7s / 790s · 4.5 / 0.5 hits ⚠1-shot | 10,322 dps · 6.7s / 796s · 5.2 / 0.6 hits ⚠1-shot | 10,439 dps · 8.9s / 1,104s · 3.5 / 0.2 hits ⚠1-shot |
| Brain caster: S staff (Archmagister's Rod) | 18,122 dps · 3.1s / 337s · 10.3 / 1.2 hits | 18,341 dps · 2.8s / 370s · 7.4 / 1 hits | 18,560 dps · 2.9s / 407s · 7.3 / 1.2 hits | 18,779 dps · 3.2s / 412s · 5.9 / 0.9 hits ⚠1-shot | 18,998 dps · 3.2s / 415s · 4.4 / 0.5 hits ⚠1-shot | 19,217 dps · 4.1s / 420s · 4.5 / 0.5 hits ⚠1-shot | 19,436 dps · 3.6s / 423s · 5.2 / 0.6 hits ⚠1-shot | 19,654 dps · 4.7s / 586s · 3.5 / 0.2 hits ⚠1-shot |
| Prayer caster: talisman spells | 8,144 dps · 6.9s / 749s · 10.3 / 1.2 hits | 8,243 dps · 6.2s / 823s · 7.4 / 1 hits | 8,341 dps · 6.4s / 905s · 7.3 / 1.2 hits | 8,440 dps · 7.1s / 917s · 5.9 / 0.9 hits ⚠1-shot | 8,539 dps · 7.2s / 924s · 4.4 / 0.5 hits ⚠1-shot | 8,637 dps · 9s / 934s · 4.5 / 0.5 hits ⚠1-shot | 8,736 dps · 8s / 941s · 5.2 / 0.6 hits ⚠1-shot | 8,835 dps · 10.5s / 1,305s · 3.5 / 0.2 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Frost Lance; spells 8,512 + weapon 1,113 · Z2 Meteor, Void Rift, Frost Lance; spells 8,615 + weapon 1,126 · Z3 Meteor, Void Rift, Frost Lance; spells 8,718 + weapon 1,140 · Z4 Meteor, Void Rift, Frost Lance; spells 8,820 + weapon 1,153 · Z5 Meteor, Void Rift, Frost Lance; spells 8,923 + weapon 1,167 · Z6 Meteor, Void Rift, Frost Lance; spells 9,026 + weapon 1,180 · Z7 Meteor, Void Rift, Frost Lance; spells 9,128 + weapon 1,194 · Z8 Meteor, Void Rift, Frost Lance; spells 9,231 + weapon 1,207
- Brain caster: S staff (Archmagister's Rod): Z1 Meteor, Void Rift, Frost Lance; spells 16,970 + weapon 1,153 · Z2 Meteor, Void Rift, Frost Lance; spells 17,174 + weapon 1,167 · Z3 Meteor, Void Rift, Frost Lance; spells 17,379 + weapon 1,181 · Z4 Meteor, Void Rift, Frost Lance; spells 17,584 + weapon 1,195 · Z5 Meteor, Void Rift, Frost Lance; spells 17,789 + weapon 1,209 · Z6 Meteor, Void Rift, Frost Lance; spells 17,993 + weapon 1,223 · Z7 Meteor, Void Rift, Frost Lance; spells 18,198 + weapon 1,237 · Z8 Meteor, Void Rift, Frost Lance; spells 18,403 + weapon 1,251
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 3,823 + weapon 4,321 · Z2 Sunray, Purify; spells 3,869 + weapon 4,373 · Z3 Sunray, Purify; spells 3,915 + weapon 4,426 · Z4 Sunray, Purify; spells 3,961 + weapon 4,479 · Z5 Sunray, Purify; spells 4,008 + weapon 4,531 · Z6 Sunray, Purify; spells 4,054 + weapon 4,584 · Z7 Sunray, Purify; spells 4,100 + weapon 4,636 · Z8 Sunray, Purify; spells 4,146 + weapon 4,689

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 389 | 179 | 749 | 4.2 |
| 2 | 427 | 197 | 823 | 4.2 |
| 3 | 470 | 216 | 905 | 4.2 |
| 4 | 476 | 219 | 917 | 4.2 |
| 5 | 479 | 221 | 924 | 4.2 |
| 6 | 485 | 223 | 934 | 4.2 |
| 7 | 488 | 225 | 941 | 4.2 |
| 8 | 677 | 311 | 1,305 | 4.2 |

## 3. Gems, compared

Each gem at the level a zone 5 drop has (first playthrough) and a +0% roll, on the quality build (longsword) at zone 5. Weapon gems are compared by how much they raise sustained light-attack DPS; armour gems by how much they raise effective HP against zone 5's room hits. Families that do neither are listed with their raw value.

Gem level 7 (zone 5 drop), +0% roll. Base: 252 DPS, 11.8 average hits to die.

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
| Leech | weapon | 0.4% of max HP healed a hit (lifesteal) | — | heals 4.7% max HP per 10 s of attacking |
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
| Greathammer | S/- | 2H | 652 | 211 | 727 | 48.3 | Earthshaker 156, Meteor Lunge 126, Unstoppable 0 |  |
| Greataxe | A/- | 2H | 584 | 180 | 530 | 41.4 | Cleave Spin 94, Execute 53, Bloodlust 0 |  |
| Colossal Sword | S/E | 2H | 718 | 235 | 737 | 43.1 | Guillotine 133, Stomp 49, Charged Swing 153 | ⚠ skills 2.03× median |
| Crossbow | B/- | 2H | 329 | 108 | 324 | 41.4 | Piercing Bolt 58, Explosive Bolt 35, Rapid Fire 64 | ⚠ 0.53× median DPS |
| Club | A/- | 2H | 1,041 | 366 | 847 | 31.1 | Bonk 197, Wild Swing 93, Tantrum 0 | ⚠ 1.79× median DPS |
| Twin Daggers | -/S | 2H | 996 | 331 | 263 | 13.8 | Shadow Step 139, Fan of Knives 37, Flurry 157 | ⚠ 1.62× median DPS; ⚠ skills 2.01× median |
| Rapier | -/S | 1H | 800 | 223 | 283 | 19 | Lunge 88, Riposte Stance 0, Thousand Cuts 96 |  |
| Katana | D/A | 2H | 905 | 348 | 415 | 15.5 | Iai Slash 107, Crescent 64, Blood Moon 0 | ⚠ 1.7× median DPS |
| Bow | -/B | 2H | 369 | 136 | 354 | 34.5 | Volley 97, Piercing Shot 49, Rain 19 | ⚠ 0.66× median DPS |
| Whip | -/E | 1H | 367 | 146 | 239 | 20.7 | Lash 68, Crack 36, Serpent Coil 70 |  |
| Greatsword | B/B | 2H | 756 | 276 | 429 | 20.7 | Shield Breaker 89, Spin Slash 50, Battle Cry 0 |  |
| Spear | B/A | 2H | 650 | 222 | 392 | 24.2 | Impale 109, Sweep 52, Phalanx 0 |  |
| Battleaxe | A/D | 2H | 603 | 205 | 465 | 31.1 | Cleave 89, Hook 40, Frenzy 0 |  |
| Mace | A/D | 2H | 615 | 212 | 486 | 31.1 | Holy Smite 92, Consecrate 50, Judgment 33 |  |
| Halberd | A/C | 2H | 515 | 178 | 387 | 29.3 | Moulinet 114, Hook Pull 40, Vault 50 |  |
| Twin Axes | A/B | 2H | 803 | 323 | 534 | 20.7 | Whirlwind 157, Throw 71, Rampage 0 | ⚠ 1.58× median DPS |
| Hollow Maul | B/-/Br B | 2H | 481 | 164 | 506 | 41.4 | Singularity 73, Event Horizon 111, Null Shell 0 |  |
| Spellblade | -/B/Br B | 1H | 424 | 175 | 273 | 19 | Arc Wave 49, Blink Strike 43, Runic Edge 0 |  |
| Censer Flail | B/-/Pr B | 2H | 586 | 200 | 454 | 31.1 | Incense 79, Brimstone 68, Sanctified Flame 0 |  |
| Dawn Glaive | -/B/Pr B | 1H | 439 | 152 | 314 | 27.6 | Sunrise 65, Halo Throw 39, Judgement Ray 43 |  |
| Chakrams | C/B | 2H | 451 | 147 | 254 | 24.2 | Orbit 75, Ring Storm 14, Grand Ring 26 |  |
| Cestus | -/A | 2H | 924 | 276 | 324 | 17.3 | Jab Rush 117, Uppercut 67, Iron Skin 0 |  |
| Rune Kris | -/B/Br B | 1H | 515 | 154 | 161 | 15.5 | Hex Cut 48, Rune Shards 17, Mirror Step 20 |  |
| Hex Hammer | B/-/Br B | 2H | 587 | 214 | 415 | 25.9 | Null Slam 79, Gravity Hook 41, Curse of Weight 0 |  |
| Harvest Sickle | -/B/Pr B | 1H | 471 | 178 | 282 | 20.7 | Reap 57, Harvest Hook 31, Bountiful Harvest 0 |  |

Spells at Spell Skill 100 (single target; fans count one projectile, ticking areas their whole duration):

| Spell | School | Damage | Cast s | Cooldown s | Stamina | Dmg / busy s | Dmg / stamina | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arcane Bolt | brain | 19 | 0.3 | 1.2 | 8 | 16 | 2.4 |  |
| Scatter Shards | brain | 14 | 0.4 | 4 | 14 | 3.5 | 1 |  |
| Frost Lance | brain | 40 | 0.5 | 5 | 16 | 8 | 2.5 |  |
| Fireball | brain | 30 | 0.6 | 6 | 18 | 5 | 1.7 |  |
| Chain Lightning | brain | 36 | 0.5 | 7 | 18 | 5.1 | 2 |  |
| Void Rift | brain | 96 | 0.7 | 9 | 22 | 10.7 | 4.4 |  |
| Arcane Beam | brain | 100 | 2.1 | 11 | 30 | 9.1 | 3.3 |  |
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
| First playthrough | 1 | L6 | 45 | 90 | 2 | 293 | 22 | 13.1 | 1 | 1 |  |
| First playthrough | 2 | L15 | 72 | 122 | 1.7 | 345 | 22 | 15.5 | 0.86 | 1.18 |  |
| First playthrough | 3 | L26 | 110 | 166 | 1.5 | 398 | 33 | 12.2 | 0.77 | 0.93 |  |
| First playthrough | 4 | L37 | 171 | 217 | 1.3 | 450 | 36 | 12.6 | 0.64 | 0.96 |  |
| First playthrough | 5 | L47 | 252 | 253 | 1 | 503 | 43 | 11.8 | 0.51 | 0.9 |  |
| First playthrough | 6 | L57 | 377 | 354 | 0.9 | 555 | 49 | 11.2 | 0.48 | 0.86 |  |
| First playthrough | 7 | L67 | 460 | 351 | 0.8 | 608 | 48 | 12.6 | 0.39 | 0.96 |  |
| First playthrough | 8 | L76 | 550 | 521 | 0.9 | 652 | 52 | 12.4 | 0.48 | 0.95 |  |
| NG+1 | 1 | L84 | 714 | 780 | 1.1 | 679 | 45 | 15.1 | 0.55 | 1.15 |  |
| NG+1 | 2 | L90 | 889 | 987 | 1.1 | 706 | 62 | 11.3 | 0.56 | 0.86 |  |
| NG+1 | 3 | L96 | 1,088 | 1,518 | 1.4 | 732 | 60 | 12.1 | 0.71 | 0.92 |  |
| NG+1 | 4 | L105 | 1,242 | 1,916 | 1.5 | 772 | 60 | 12.9 | 0.78 | 0.98 |  |
| NG+1 | 5 | L117 | 1,429 | 2,065 | 1.4 | 812 | 69 | 11.8 | 0.73 | 0.9 |  |
| NG+1 | 6 | L127 | 1,611 | 2,753 | 1.7 | 851 | 73 | 11.6 | 0.87 | 0.88 |  |
| NG+1 | 7 | L134 | 1,782 | 2,464 | 1.4 | 877 | 61 | 14.4 | 0.7 | 1.1 |  |
| NG+1 | 8 | L142 | 1,962 | 3,481 | 1.8 | 915 | 86 | 10.7 | 0.9 | 0.82 |  |
| NG+2 | 1 | L149 | 2,321 | 4,747 | 2 | 939 | 56 | 16.8 | 1.04 | 1.28 |  |
| NG+2 | 2 | L155 | 2,696 | 5,281 | 2 | 964 | 79 | 12.3 | 0.99 | 0.94 |  |
| NG+2 | 3 | L162 | 3,119 | 5,963 | 1.9 | 989 | 81 | 12.2 | 0.97 | 0.93 |  |
| NG+2 | 4 | L171 | 3,389 | 6,935 | 2 | 1,026 | 85 | 12.1 | 1.04 | 0.92 |  |
| NG+2 | 5 | L184 | 3,784 | 7,566 | 2 | 1,063 | 104 | 10.3 | 1.01 | 0.78 |  |
| NG+2 | 6 | L194 | 4,110 | 10,091 | 2.5 | 1,100 | 115 | 9.6 | 1.24 | 0.73 |  |
| NG+2 | 7 | L202 | 4,396 | 9,429 | 2.1 | 1,137 | 98 | 11.6 | 1.09 | 0.89 |  |
| NG+2 | 8 | L210 | 4,731 | 12,920 | 2.7 | 1,161 | 146 | 8 | 1.38 | 0.61 |  |
| NG+3 | 1 | L217 | 5,355 | 12,318 | 2.3 | 1,186 | 61 | 19.3 | 1.16 | 1.48 |  |
| NG+3 | 2 | L225 | 6,047 | 10,968 | 1.8 | 1,223 | 90 | 13.6 | 0.92 | 1.04 |  |
| NG+3 | 3 | L232 | 6,773 | 11,551 | 1.7 | 1,247 | 97 | 12.9 | 0.86 | 0.98 |  |
| NG+3 | 4 | L242 | 7,275 | 12,652 | 1.7 | 1,284 | 102 | 12.6 | 0.88 | 0.96 |  |
| NG+3 | 5 | L255 | 7,853 | 13,389 | 1.7 | 1,334 | 128 | 10.4 | 0.86 | 0.79 |  |
| NG+3 | 6 | L266 | 8,389 | 16,840 | 2 | 1,371 | 146 | 9.4 | 1.02 | 0.72 |  |
| NG+3 | 7 | L275 | 8,903 | 15,193 | 1.7 | 1,408 | 130 | 10.9 | 0.86 | 0.83 |  |
| NG+3 | 8 | L283 | 9,409 | 20,132 | 2.1 | 1,432 | 199 | 7.2 | 1.08 | 0.55 |  |
| NG+4 | 1 | L291 | 10,412 | 19,317 | 1.9 | 1,469 | 70 | 21.1 | 0.94 | 1.61 |  |
| NG+4 | 2 | L299 | 11,562 | 17,287 | 1.5 | 1,494 | 104 | 14.4 | 0.76 | 1.1 |  |
| NG+4 | 3 | L306 | 12,701 | 17,759 | 1.4 | 1,494 | 113 | 13.2 | 0.71 | 1 |  |
| NG+4 | 4 | L317 | 13,479 | 20,038 | 1.5 | 1,494 | 120 | 12.4 | 0.75 | 0.95 |  |
| NG+4 | 5 | L332 | 14,378 | 20,678 | 1.4 | 1,494 | 153 | 9.8 | 0.73 | 0.75 |  |
| NG+4 | 6 | L343 | 15,261 | 26,699 | 1.7 | 1,494 | 173 | 8.7 | 0.89 | 0.66 |  |
| NG+4 | 7 | L352 | 15,988 | 23,519 | 1.5 | 1,494 | 152 | 9.9 | 0.74 | 0.75 |  |
| NG+4 | 8 | L360 | 16,560 | 31,917 | 1.9 | 1,494 | 230 | 6.5 | 0.98 | 0.5 | ⚠ survives 2× fewer hits |
| NG+5 | 1 | L369 | 16,997 | 23,380 | 1.4 | 1,494 | 69 | 21.7 | 0.7 | 1.66 |  |
| NG+5 | 2 | L377 | 17,472 | 21,758 | 1.2 | 1,494 | 105 | 14.2 | 0.63 | 1.08 |  |
| NG+5 | 3 | L385 | 17,913 | 22,616 | 1.3 | 1,494 | 118 | 12.7 | 0.64 | 0.97 |  |
| NG+5 | 4 | L396 | 18,466 | 25,399 | 1.4 | 1,494 | 122 | 12.2 | 0.7 | 0.93 |  |
| NG+5 | 5 | L411 | 18,949 | 26,210 | 1.4 | 1,494 | 153 | 9.8 | 0.7 | 0.75 |  |
| NG+5 | 6 | L424 | 19,510 | 32,869 | 1.7 | 1,494 | 170 | 8.8 | 0.85 | 0.67 |  |
| NG+5 | 7 | L433 | 19,923 | 29,709 | 1.5 | 1,494 | 146 | 10.2 | 0.76 | 0.78 |  |
| NG+5 | 8 | L443 | 20,414 | 39,949 | 2 | 1,494 | 224 | 6.7 | 0.99 | 0.51 |  |
| NG+6 | 1 | L452 | 20,829 | 27,962 | 1.3 | 1,494 | 66 | 22.6 | 0.68 | 1.73 |  |
| NG+6 | 2 | L461 | 21,243 | 26,927 | 1.3 | 1,494 | 101 | 14.7 | 0.64 | 1.12 |  |
| NG+6 | 3 | L470 | 21,658 | 27,119 | 1.3 | 1,494 | 114 | 13.1 | 0.63 | 1 |  |
| NG+6 | 4 | L482 | 22,073 | 31,234 | 1.4 | 1,494 | 118 | 12.6 | 0.72 | 0.96 |  |
| NG+6 | 5 | L499 | 22,487 | 31,394 | 1.4 | 1,494 | 149 | 10 | 0.71 | 0.77 |  |
| NG+6 | 6 | L512 | 22,902 | 39,993 | 1.7 | 1,494 | 166 | 9 | 0.88 | 0.69 |  |
| NG+6 | 7 | L522 | 23,317 | 35,545 | 1.5 | 1,494 | 143 | 10.4 | 0.77 | 0.8 |  |
| NG+6 | 8 | L532 | 23,732 | 48,413 | 2 | 1,494 | 220 | 6.8 | 1.03 | 0.52 |  |
| NG+7 | 1 | L541 | 24,146 | 33,261 | 1.4 | 1,494 | 62 | 24 | 0.7 | 1.83 |  |
| NG+7 | 2 | L551 | 24,561 | 31,208 | 1.3 | 1,494 | 96 | 15.6 | 0.64 | 1.19 |  |
| NG+7 | 3 | L560 | 24,976 | 32,369 | 1.3 | 1,494 | 108 | 13.9 | 0.66 | 1.06 |  |
| NG+7 | 4 | L572 | 25,391 | 36,200 | 1.4 | 1,494 | 112 | 13.3 | 0.72 | 1.01 |  |
| NG+7 | 5 | L589 | 25,805 | 37,356 | 1.4 | 1,494 | 142 | 10.6 | 0.73 | 0.8 |  |
| NG+7 | 6 | L603 | 26,220 | 47,345 | 1.8 | 1,494 | 158 | 9.5 | 0.91 | 0.72 |  |
| NG+7 | 7 | L614 | 26,635 | 42,209 | 1.6 | 1,494 | 137 | 10.9 | 0.8 | 0.83 |  |
| NG+7 | 8 | L624 | 27,049 | 56,110 | 2.1 | 1,494 | 211 | 7.1 | 1.05 | 0.54 |  |
| NG+10 | 1 | L839 | 34,100 | 56,365 | 1.7 | 1,494 | 154 | 9.7 | 0.84 | 0.74 |  |
| NG+10 | 2 | L850 | 34,515 | 51,511 | 1.5 | 1,494 | 238 | 6.3 | 0.76 | 0.48 | ⚠ survives 2.1× fewer hits |
| NG+10 | 3 | L861 | 34,929 | 53,428 | 1.5 | 1,494 | 269 | 5.6 | 0.77 | 0.42 | ⚠ survives 2.4× fewer hits |
| NG+10 | 4 | L876 | 35,344 | 59,750 | 1.7 | 1,494 | 282 | 5.3 | 0.86 | 0.4 | ⚠ survives 2.5× fewer hits |
| NG+10 | 5 | L896 | 35,759 | 61,658 | 1.7 | 1,494 | 357 | 4.2 | 0.87 | 0.32 | ⚠ survives 3.1× fewer hits |
| NG+10 | 6 | L912 | 36,173 | 78,146 | 2.2 | 1,494 | 400 | 3.7 | 1.09 | 0.28 | ⚠ survives 3.5× fewer hits |
| NG+10 | 7 | L924 | 36,588 | 69,669 | 1.9 | 1,494 | 347 | 4.3 | 0.96 | 0.33 | ⚠ survives 3× fewer hits |
| NG+10 | 8 | L937 | 37,003 | 92,613 | 2.5 | 1,494 | 540 | 2.8 | 1.27 | 0.21 | ⚠ survives 4.7× fewer hits |

