# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Bonk: greathammer (2H) build (767 HP) in one hit (0.97). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
2. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Slicey: twin daggers build (648 HP) in one hit (0.82). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
3. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Bow (Slicey) build (640 HP) in one hit (0.81). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
4. **Build spread** (severity 5): NG+6 zone 7: the slowest build (Prayer caster: talisman spells) takes 783 s on the boss, 3.9× the fastest (Quality: longsword + shield, 199 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
5. **Build spread** (severity 5): NG+6 zone 6: the slowest build (Prayer caster: talisman spells) takes 783 s on the boss, 3.9× the fastest (Quality: longsword + shield, 199 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
6. **Build spread** (severity 5): NG+6 zone 4: the slowest build (Prayer caster: talisman spells) takes 777 s on the boss, 3.9× the fastest (Quality: longsword + shield, 197 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
7. **Gems** (severity 4.6): Quicksilver raises sustained DPS by +3% (burst +7%) where Brutal gives +6% (0.41× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
8. **Weapons** (severity 4.4): Katana: 266 sustained light-attack DPS, 1.72× the median weapon (155) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
9. **Weapons** (severity 4.3): Twin Axes: 262 sustained light-attack DPS, 1.7× the median weapon (155) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
10. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
11. **Boss length** (severity 4.1): NG+5 zone 1: the median build needs 338 s of nonstop hitting to kill The Caretaker (2,533,180 HP), 5.6 minutes before any dodging (target 8 min, D301). *Suggested:* Raise its NG_BOSS_HP factor (D301).
12. **Boss length** (severity 4.1): NG+7 zone 1: the median build needs 338 s of nonstop hitting to kill The Caretaker (3,690,201 HP), 5.6 minutes before any dodging (target 8 min, D301). *Suggested:* Raise its NG_BOSS_HP factor (D301).
13. **Boss length** (severity 4.1): NG+6 zone 1: the median build needs 336 s of nonstop hitting to kill The Caretaker (3,099,244 HP), 5.6 minutes before any dodging (target 8 min, D301). *Suggested:* Raise its NG_BOSS_HP factor (D301).
14. **Weapons** (severity 4.1): Crossbow: 96 sustained light-attack DPS, 0.62× the median weapon (155) at equal fitting stats. *Suggested:* Raise its base damage / combo multipliers (D40: poor scaling should mean higher base, not lower DPS).
15. **Weapons** (severity 4.1): Twin Daggers: 250 sustained light-attack DPS, 1.62× the median weapon (155) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
16. **Enemy curve** (severity 3.8): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 108. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
17. **Spells** (severity 3.5): Arcane Beam (brain): 16.4 damage per busy second at Spell Skill 100, 2.05× the brain median (8). *Suggested:* Lengthen its cooldown or lower its base.
18. **Enemy curve** (severity 3.4): NG+4: zone 7 room enemies have 23,519 HP on average, below zone 6's 26,699. *Suggested:* Check the zone roster mix and the HP curve.
19. **Enemy curve** (severity 3.3): NG+6: zone 7 room enemies have 35,545 HP on average, below zone 6's 39,993. *Suggested:* Check the zone roster mix and the HP curve.
20. **Enemy curve** (severity 3.2): NG+3: zone 2 room enemies have 10,968 HP on average, below zone 1's 12,318. *Suggested:* Check the zone roster mix and the HP curve.
21. **Gear power** (severity 3): Reinforcement reaches ×3.25 at +15, while the whole rarity ladder is ×1.28: a +15 common out-hits a +0 legendary 2.5×, so drops matter little once reinforcement starts. *Suggested:* Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.

(96 more findings of the same kinds are in the tables below.)

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
| 1 | 1,949 | 391–3,907 | 129 | 40–240 |  |
| 2 | 1,762 | 401–4,014 | 219 | 41–534 | ⚠ HP below zone 1 |
| 3 | 1,760 | 401–4,009 | 223 | 42–698 |  |
| 4 | 1,983 | 419–5,231 | 244 | 46–696 |  |
| 5 | 2,065 | 437–4,731 | 254 | 63–538 |  |
| 6 | 2,753 | 476–6,658 | 269 | 45–672 |  |
| 7 | 2,464 | 492–6,147 | 277 | 77–817 | ⚠ HP below zone 6 |
| 8 | 3,481 | 540–8,096 | 299 | 58–1,154 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 182 (1,520) | 388 (1,561) | 301 (1,559) | 379 (1,628) | 347 (1,698) | 366 (1,849) | 401 (1,912) | 289 (2,099) |
| brute | 193 (3,907) | 410 (4,014) | 500 (4,009) | 561 (4,185) | 404 (4,367) | 585 (6,658) | 673 (4,917) | 715 (8,096) |
| caster | 138 (1,194) | 181 (1,227) | 177 (1,225) | 245 (1,279) | 186 (1,334) | 216 (1,453) | 236 (1,503) | 181 (1,649) |
| fodder | 108 (1,302) | 175 (1,472) | 137 (1,203) | 178 (1,395) | 198 (1,601) | 193 (1,902) | 213 (1,967) | 223 (2,339) |
| hazard | 105 (1,737) | 164 (1,784) | 244 (2,317) | 155 (1,860) | 225 (2,329) | 261 (2,114) | 215 (2,185) | 330 (4,798) |
| ranged | 90 (1,085) | 144 (1,115) | 209 (1,114) | 184 (1,163) | 186 (1,213) | 168 (1,321) | 215 (2,049) | 186 (1,499) |
| support | 83 (1,194) | 158 (1,227) | — | 181 (1,279) | 355 (1,334) | 180 (1,453) | 177 (1,503) | 238 (1,649) |
| swarm | 40 (391) | 62 (401) | 49 (401) | 66 (419) | 70 (437) | 52 (476) | 89 (492) | 82 (540) |
| tank | 163 (3,256) | 334 (3,345) | 295 (3,341) | 318 (5,231) | 373 (4,731) | 334 (5,152) | 335 (6,147) | 375 (6,072) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 29,697 / 44,545 / 44,545 | 118,787 | 519 / 570 / 654 | 1,019 |  |
| 2 | Mother Spore | 3 | 37,657 / 56,485 / 56,485 | 150,626 | 394 / 598 / 733 | 1,162 |  |
| 3 | The Bloatking | 3 | 43,259 / 64,889 / 64,889 | 173,037 | 471 / 607 / 740 | 963 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 49,534 / 74,301 / 74,301 | 198,137 | 563 / 788 / 938 | 1,308 |  |
| 5 | Foreman Ignatius | 3 | 83,552 / 69,628 / 69,628 | 222,807 | 626 / 907 / 1,057 | 1,844 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 31,485 / 110,197 / 110,197 | 251,879 | 604 / 917 / 1,003 | 1,697 |  |
| 7 | Archmagister Tock | 3 | 84,338 / 98,394 / 98,394 | 281,126 | 859 / 1,300 / 1,540 | 1,961 |  |
| 8 | The Landlord | 4 | 124,055 / 120,406 / 120,405 / 144,487 | 509,354 | 1,015 / 1,291 / 1,904 / 1,613 | 2,878 |  |

### NG+2

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 5,585 | 1,119–11,195 | 312 | 96–578 |  |
| 2 | 5,281 | 1,203–12,034 | 531 | 99–1,293 | ⚠ HP below zone 1 |
| 3 | 5,963 | 1,359–13,587 | 555 | 104–1,738 |  |
| 4 | 6,935 | 1,463–18,292 | 627 | 119–1,785 |  |
| 5 | 7,566 | 1,600–17,338 | 672 | 166–1,422 |  |
| 6 | 10,091 | 1,743–24,403 | 723 | 120–1,807 |  |
| 7 | 9,429 | 1,882–23,521 | 768 | 215–2,266 | ⚠ HP below zone 6 |
| 8 | 12,920 | 2,003–30,046 | 837 | 161–3,228 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 439 (4,354) | 940 (4,680) | 750 (5,284) | 972 (5,691) | 917 (6,224) | 984 (6,779) | 1,113 (7,318) | 807 (7,790) |
| brute | 466 (11,195) | 994 (12,034) | 1,246 (13,587) | 1,438 (14,634) | 1,069 (16,004) | 1,573 (24,403) | 1,869 (18,817) | 1,999 (30,046) |
| caster | 331 (3,421) | 438 (3,677) | 442 (4,152) | 627 (4,471) | 493 (4,890) | 580 (5,326) | 656 (5,750) | 507 (6,121) |
| fodder | 260 (3,732) | 425 (4,412) | 342 (4,076) | 457 (4,878) | 524 (5,868) | 519 (6,972) | 590 (7,527) | 623 (8,680) |
| hazard | 253 (4,975) | 398 (5,348) | 608 (7,850) | 397 (6,504) | 595 (8,536) | 703 (7,747) | 596 (8,363) | 922 (17,805) |
| ranged | 217 (3,110) | 348 (3,343) | 521 (3,774) | 471 (4,065) | 491 (4,446) | 452 (4,842) | 596 (7,840) | 519 (5,564) |
| support | 199 (3,421) | 383 (3,677) | — | 463 (4,471) | 939 (4,890) | 483 (5,326) | 492 (5,750) | 666 (6,121) |
| swarm | 96 (1,119) | 149 (1,203) | 122 (1,359) | 169 (1,463) | 186 (1,600) | 141 (1,743) | 247 (1,882) | 231 (2,003) |
| tank | 392 (9,329) | 808 (10,028) | 734 (11,322) | 816 (18,292) | 986 (17,338) | 897 (18,884) | 930 (23,521) | 1,049 (22,535) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 150,828 / 226,243 / 226,243 | 603,314 | 1,250 / 1,372 / 1,576 | 2,455 |  |
| 2 | Mother Spore | 3 | 177,189 / 265,783 / 265,783 | 708,756 | 954 / 1,448 / 1,777 | 2,814 |  |
| 3 | The Bloatking | 3 | 208,068 / 312,102 / 312,102 | 832,271 | 1,174 / 1,513 / 1,843 | 2,400 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 224,217 / 336,325 / 336,325 | 896,868 | 1,442 / 2,020 / 2,404 | 3,353 |  |
| 5 | Foreman Ignatius | 3 | 366,964 / 305,804 / 305,804 | 978,573 | 1,656 / 2,400 / 2,797 | 4,879 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 132,145 / 462,508 / 462,508 | 1,057,161 | 1,623 / 2,464 / 2,696 | 4,562 |  |
| 7 | Archmagister Tock | 3 | 333,618 / 389,221 / 389,221 | 1,112,060 | 2,383 / 3,608 / 4,275 | 5,442 |  |
| 8 | The Landlord | 4 | 389,252 / 377,803 / 377,802 / 453,364 | 1,598,221 | 2,837 / 3,611 / 5,324 / 4,512 | 8,048 |  |

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
| 1 | The Caretaker | 3 | 335,992 / 503,988 / 503,988 | 1,343,968 | 2,283 / 2,508 / 2,880 | 4,486 |  |
| 2 | Mother Spore | 3 | 368,691 / 553,037 / 553,037 | 1,474,766 | 1,798 / 2,728 / 3,348 | 5,303 |  |
| 3 | The Bloatking | 3 | 409,173 / 613,760 / 613,760 | 1,636,693 | 2,251 / 2,901 / 3,534 | 4,602 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 416,431 / 624,646 / 624,646 | 1,665,723 | 2,754 / 3,857 / 4,590 | 6,401 |  |
| 5 | Foreman Ignatius | 3 | 635,208 / 529,341 / 529,341 | 1,693,890 | 3,204 / 4,642 / 5,410 | 9,437 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 216,193 / 756,674 / 756,674 | 1,729,541 | 3,181 / 4,831 / 5,284 | 8,943 |  |
| 7 | Archmagister Tock | 3 | 527,888 / 615,869 / 615,869 | 1,759,625 | 4,881 / 7,388 / 8,755 | 11,143 |  |
| 8 | The Landlord | 4 | 600,439 / 582,779 / 582,778 / 699,335 | 2,465,332 | 5,845 / 7,440 / 10,968 / 9,296 | 16,580 |  |

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
| 1 | The Caretaker | 3 | 515,926 / 773,890 / 773,890 | 2,063,706 | 3,927 / 4,313 / 4,953 | 7,715 |  |
| 2 | Mother Spore | 3 | 571,443 / 857,165 / 857,165 | 2,285,773 | 3,105 / 4,710 / 5,779 | 9,155 |  |
| 3 | The Bloatking | 3 | 630,959 / 946,439 / 946,439 | 2,523,837 | 3,882 / 5,003 / 6,094 | 7,936 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 651,113 / 976,669 / 976,669 | 2,604,451 | 4,768 / 6,678 / 7,948 | 11,083 |  |
| 5 | Foreman Ignatius | 3 | 996,912 / 830,761 / 830,761 | 2,658,435 | 5,528 / 8,010 / 9,335 | 16,283 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 342,074 / 1,197,258 / 1,197,258 | 2,736,589 | 5,406 / 8,209 / 8,980 | 15,197 |  |
| 7 | Archmagister Tock | 3 | 842,127 / 982,481 / 982,481 | 2,807,089 | 8,201 / 12,414 / 14,711 | 18,723 |  |
| 8 | The Landlord | 4 | 963,540 / 935,200 / 935,199 / 1,122,240 | 3,956,179 | 9,546 / 12,149 / 17,911 / 15,180 | 27,075 |  |

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
| 1 | The Caretaker | 3 | 633,295 / 949,943 / 949,943 | 2,533,180 | 5,215 / 5,727 / 6,577 | 10,245 |  |
| 2 | Mother Spore | 3 | 712,788 / 1,069,182 / 1,069,182 | 2,851,152 | 4,039 / 6,127 / 7,518 | 11,909 |  |
| 3 | The Bloatking | 3 | 795,515 / 1,193,273 / 1,193,273 | 3,182,061 | 4,884 / 6,295 / 7,668 | 9,986 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 822,844 / 1,234,266 / 1,234,266 | 3,291,376 | 5,833 / 8,170 / 9,723 | 13,559 |  |
| 5 | Foreman Ignatius | 3 | 1,261,113 / 1,050,929 / 1,050,929 | 3,362,971 | 6,629 / 9,605 / 11,195 | 19,526 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 430,872 / 1,508,051 / 1,508,051 | 3,446,975 | 6,337 / 9,624 / 10,527 | 17,815 |  |
| 7 | Archmagister Tock | 3 | 1,058,493 / 1,234,909 / 1,234,909 | 3,528,310 | 9,431 / 14,276 / 16,917 | 21,531 |  |
| 8 | The Landlord | 4 | 1,212,064 / 1,176,415 / 1,176,414 / 1,411,698 | 4,976,591 | 10,977 / 13,971 / 20,598 / 17,458 | 31,136 |  |

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
| 1 | The Caretaker | 3 | 774,811 / 1,162,216 / 1,162,216 | 3,099,244 | 5,916 / 6,497 / 7,462 | 11,623 |  |
| 2 | Mother Spore | 3 | 861,725 / 1,292,588 / 1,292,588 | 3,446,901 | 4,582 / 6,951 / 8,529 | 13,511 |  |
| 3 | The Bloatking | 3 | 965,417 / 1,448,126 / 1,448,126 | 3,861,669 | 5,541 / 7,142 / 8,698 | 11,328 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 993,671 / 1,490,507 / 1,490,507 | 3,974,684 | 6,617 / 9,269 / 11,030 | 15,382 |  |
| 5 | Foreman Ignatius | 3 | 1,524,075 / 1,270,064 / 1,270,064 | 4,064,202 | 7,520 / 10,897 / 12,700 | 22,151 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 522,704 / 1,829,464 / 1,829,464 | 4,181,633 | 7,190 / 10,918 / 11,943 | 20,211 |  |
| 7 | Archmagister Tock | 3 | 1,280,267 / 1,493,645 / 1,493,645 | 4,267,557 | 10,699 / 16,196 / 19,192 | 24,426 |  |
| 8 | The Landlord | 4 | 1,464,476 / 1,421,403 / 1,421,402 / 1,705,684 | 6,012,965 | 12,453 / 15,850 / 23,367 / 19,805 | 35,323 |  |

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
| NG+1 | L84 · ilvl 9 · epic +4 | L90 · ilvl 10 · epic +5 | L96 · ilvl 11 · epic +6 | L102 · ilvl 12 · epic +6 | L108 · ilvl 13 · epic +6 | L115 · ilvl 14 · epic +6 | L122 · ilvl 15 · epic +6 | L130 · ilvl 16 · epic +6 |
| NG+2 | L137 · ilvl 17 · epic +7 | L143 · ilvl 18 · epic +8 | L150 · ilvl 19 · epic +9 | L156 · ilvl 20 · epic +9 | L163 · ilvl 21 · epic +9 | L170 · ilvl 22 · epic +9 | L178 · ilvl 23 · epic +9 | L186 · ilvl 24 · epic +9 |
| NG+3 | L193 · ilvl 25 · epic +10 | L201 · ilvl 26 · epic +11 | L208 · ilvl 27 · epic +12 | L215 · ilvl 28 · epic +12 | L222 · ilvl 29 · epic +12 | L230 · ilvl 30 · epic +12 | L239 · ilvl 31 · epic +12 | L247 · ilvl 32 · epic +12 |
| NG+4 | L255 · ilvl 33 · epic +13 | L263 · ilvl 34 · epic +14 | L270 · ilvl 35 · epic +15 | L278 · ilvl 36 · epic +15 | L285 · ilvl 37 · epic +15 | L293 · ilvl 38 · epic +15 | L302 · ilvl 39 · epic +15 | L312 · ilvl 40 · epic +15 |
| NG+5 | L321 · ilvl 41 · epic +15 | L329 · ilvl 42 · epic +15 | L337 · ilvl 43 · epic +15 | L345 · ilvl 44 · epic +15 | L352 · ilvl 45 · epic +15 | L361 · ilvl 46 · epic +15 | L371 · ilvl 47 · epic +15 | L381 · ilvl 48 · epic +15 |
| NG+6 | L390 · ilvl 49 · epic +15 | L399 · ilvl 50 · epic +15 | L408 · ilvl 51 · epic +15 | L416 · ilvl 52 · epic +15 | L425 · ilvl 53 · epic +15 | L434 · ilvl 54 · epic +15 | L445 · ilvl 55 · epic +15 | L455 · ilvl 56 · epic +15 |
| NG+7 | L466 · ilvl 57 · epic +15 | L476 · ilvl 58 · epic +15 | L485 · ilvl 59 · epic +15 | L493 · ilvl 60 · epic +15 | L502 · ilvl 61 · epic +15 | L511 · ilvl 62 · epic +15 | L522 · ilvl 63 · epic +15 | L533 · ilvl 64 · epic +15 |
| NG+10 | L717 · ilvl 81 · epic +15 | L728 · ilvl 82 · epic +15 | L739 · ilvl 83 · epic +15 | L749 · ilvl 84 · epic +15 | L760 · ilvl 85 · epic +15 | L772 · ilvl 86 · epic +15 | L785 · ilvl 87 · epic +15 | L798 · ilvl 88 · epic +15 |

### First playthrough

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 33 dps · 2.7s / 77s · 17.7 / 3.7 hits | 53 dps · 2.3s / 106s · 23.2 / 3.1 hits | 80 dps · 2.1s / 95s · 19.4 / 3.9 hits | 123 dps · 1.8s / 85s · 17.8 / 3.2 hits | 194 dps · 1.3s / 88s · 15.4 / 2.2 hits | 310 dps · 1.1s / 61s · 16.6 / 2.8 hits | 400 dps · 0.9s / 53s · 17.6 / 3 hits | 508 dps · 1s / 111s · 18.2 / 1.4 hits |
| Slicey: twin daggers | 33 dps · 2.7s / 77s · 13 / 2.7 hits | 53 dps · 2.3s / 106s · 17.4 / 2.4 hits | 82 dps · 2s / 93s · 14.8 / 3 hits | 128 dps · 1.7s / 82s · 13.8 / 2.5 hits | 185 dps · 1.4s / 93s · 12.1 / 1.7 hits | 274 dps · 1.3s / 69s · 13.2 / 2.2 hits | 331 dps · 1.1s / 64s · 14.2 / 2.4 hits | 399 dps · 1.3s / 141s · 15.2 / 1.1 hits |
| Quality: longsword + shield | 44 dps · 2s / 57s · 16.8 / 3.5 hits | 69 dps · 1.8s / 81s · 22.4 / 3 hits | 103 dps · 1.6s / 73s · 19 / 3.8 hits | 158 dps · 1.4s / 67s · 17.7 / 3.2 hits | 226 dps · 1.1s / 76s · 15.5 / 2.2 hits | 330 dps · 1.1s / 57s · 16.7 / 2.8 hits | 394 dps · 0.9s / 53s · 18 / 3 hits | 462 dps · 1.1s / 122s · 18.9 / 1.4 hits |
| Bow (Slicey) | 34 dps · 2.7s / 74s · 12.2 / 2.5 hits | 53 dps · 2.3s / 106s · 16.5 / 2.2 hits | 78 dps · 2.1s / 97s · 14.1 / 2.8 hits | 118 dps · 1.8s / 89s · 13.3 / 2.4 hits | 167 dps · 1.5s / 103s · 11.7 / 1.7 hits | 246 dps · 1.4s / 77s · 12.7 / 2.1 hits | 291 dps · 1.2s / 72s · 13.8 / 2.3 hits | 344 dps · 1.5s / 164s · 14.8 / 1.1 hits |
| Crossbow (Bonk) | 17 dps · 5.1s / 144s · 17.7 / 3.7 hits | 27 dps · 4.5s / 205s · 23.2 / 3.1 hits | 40 dps · 4.1s / 188s · 19.4 / 3.9 hits | 61 dps · 3.6s / 172s · 17.8 / 3.2 hits | 89 dps · 2.8s / 192s · 15.4 / 2.2 hits | 129 dps · 2.7s / 146s · 16.6 / 2.8 hits | 153 dps · 2.3s / 137s · 17.6 / 3 hits | 181 dps · 2.9s / 311s · 18.2 / 1.4 hits |
| Brain caster: staff spells | 37 dps · 2.4s / 68s · 12.2 / 2.5 hits | 63 dps · 1.9s / 88s · 16.5 / 2.2 hits | 96 dps · 1.7s / 79s · 14.1 / 2.8 hits | 139 dps · 1.6s / 76s · 13.3 / 2.4 hits | 191 dps · 1.3s / 90s · 11.7 / 1.7 hits | 268 dps · 1.3s / 70s · 12.7 / 2.1 hits | 319 dps · 1.1s / 66s · 13.8 / 2.3 hits | 375 dps · 1.4s / 151s · 14.8 / 1.1 hits |
| Prayer caster: talisman spells | 37 dps · 2.4s / 67s · 13 / 2.7 hits | 34 dps · 3.6s / 165s · 17.4 / 2.4 hits | 49 dps · 3.4s / 154s · 14.8 / 3 hits | 74 dps · 2.9s / 142s · 13.8 / 2.5 hits | 103 dps · 2.4s / 166s · 12.1 / 1.7 hits | 148 dps · 2.4s / 127s · 13.2 / 2.2 hits | 177 dps · 2s / 119s · 14.2 / 2.4 hits | 212 dps · 2.5s / 266s · 15.2 / 1.1 hits |

- Brain caster: staff spells: Z1 Void Rift, Frost Lance, Fireball; spells 33 + weapon 5 · Z2 Void Rift, Arcane Beam, Frost Lance; spells 61 + weapon 3 · Z3 Meteor, Void Rift, Arcane Beam; spells 90 + weapon 6 · Z4 Meteor, Void Rift, Arcane Beam; spells 130 + weapon 9 · Z5 Meteor, Void Rift, Arcane Beam; spells 178 + weapon 12 · Z6 Meteor, Void Rift, Arcane Beam; spells 251 + weapon 17 · Z7 Meteor, Void Rift, Arcane Beam; spells 299 + weapon 20 · Z8 Meteor, Void Rift, Arcane Beam; spells 351 + weapon 24
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 13 + weapon 24 · Z2 Sunray, Purify; spells 19 + weapon 15 · Z3 Sunray, Purify; spells 27 + weapon 22 · Z4 Sunray, Purify; spells 40 + weapon 34 · Z5 Sunray, Purify; spells 55 + weapon 48 · Z6 Sunray, Purify; spells 78 + weapon 70 · Z7 Sunray, Purify; spells 93 + weapon 84 · Z8 Sunray, Purify; spells 111 + weapon 101

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 74 | 57 | 144 | 2.5 |
| 2 | 106 | 81 | 205 | 2.5 |
| 3 | 95 | 73 | 188 | 2.6 |
| 4 | 85 | 67 | 172 | 2.6 |
| 5 | 93 | 76 | 192 | 2.5 |
| 6 | 70 | 57 | 146 | 2.6 |
| 7 | 66 | 53 | 137 | 2.6 |
| 8 | 151 | 111 | 311 | 2.8 |

### NG+1

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 687 dps · 2.8s / 173s · 18.2 / 2 hits | 874 dps · 2s / 172s · 15.3 / 2.1 hits | 1,078 dps · 1.6s / 161s · 17.9 / 3 hits | 1,230 dps · 1.6s / 161s · 15.9 / 2.4 hits | 1,385 dps · 1.5s / 161s · 13.5 / 1.4 hits | 1,556 dps · 1.8s / 162s · 14.8 / 1.7 hits | 1,726 dps · 1.4s / 163s · 17.9 / 2 hits | 1,937 dps · 1.8s / 263s · 13.9 / 1 hits ⚠1-shot |
| Slicey: twin daggers | 546 dps · 3.6s / 218s · 15.3 / 1.7 hits | 702 dps · 2.5s / 214s · 12.8 / 1.8 hits | 870 dps · 2s / 199s · 15 / 2.5 hits | 998 dps · 2s / 198s · 13.4 / 2 hits | 1,140 dps · 1.8s / 195s · 11.3 / 1.2 hits | 1,308 dps · 2.1s / 193s · 12.5 / 1.4 hits | 1,471 dps · 1.7s / 191s · 15.1 / 1.7 hits | 1,686 dps · 2.1s / 302s · 11.7 / 0.8 hits ⚠1-shot |
| Quality: longsword + shield | 586 dps · 3.3s / 203s · 18.9 / 2.1 hits | 720 dps · 2.4s / 209s · 15.9 / 2.2 hits | 874 dps · 2s / 198s · 18.6 / 3.1 hits | 966 dps · 2.1s / 205s · 16.7 / 2.5 hits | 1,060 dps · 1.9s / 210s · 14.1 / 1.5 hits | 1,163 dps · 2.4s / 217s · 15.5 / 1.8 hits | 1,268 dps · 1.9s / 222s · 18.7 / 2.1 hits | 1,383 dps · 2.5s / 368s · 14.6 / 1 hits |
| Bow (Slicey) | 458 dps · 4.3s / 259s · 15 / 1.7 hits | 578 dps · 3s / 261s · 12.7 / 1.7 hits | 708 dps · 2.5s / 244s · 14.8 / 2.5 hits | 802 dps · 2.5s / 247s · 13.3 / 2 hits | 912 dps · 2.3s / 244s · 11.2 / 1.2 hits | 1,032 dps · 2.7s / 244s · 12.3 / 1.4 hits | 1,148 dps · 2.1s / 245s · 14.9 / 1.7 hits | 1,297 dps · 2.7s / 393s · 11.6 / 0.8 hits ⚠1-shot |
| Crossbow (Bonk) | 241 dps · 8.1s / 493s · 18.2 / 2 hits | 304 dps · 5.8s / 496s · 15.3 / 2.1 hits | 373 dps · 4.7s / 464s · 17.9 / 3 hits | 430 dps · 4.6s / 461s · 15.9 / 2.4 hits | 483 dps · 4.3s / 461s · 13.5 / 1.4 hits | 547 dps · 5s / 461s · 14.8 / 1.7 hits | 609 dps · 4s / 462s · 17.9 / 2 hits | 688 dps · 5.1s / 741s · 13.9 / 1 hits ⚠1-shot |
| Brain caster: staff spells | 483 dps · 4s / 246s · 15 / 1.7 hits | 597 dps · 2.9s / 252s · 12.7 / 1.7 hits | 727 dps · 2.4s / 238s · 14.8 / 2.5 hits | 809 dps · 2.5s / 245s · 13.3 / 2 hits | 895 dps · 2.3s / 249s · 11.2 / 1.2 hits | 995 dps · 2.8s / 253s · 12.3 / 1.4 hits | 1,099 dps · 2.2s / 256s · 14.9 / 1.7 hits | 1,218 dps · 2.9s / 418s · 11.6 / 0.8 hits ⚠1-shot |
| Prayer caster: talisman spells | 281 dps · 6.9s / 423s · 15.3 / 1.7 hits | 351 dps · 5s / 429s · 12.8 / 1.8 hits | 432 dps · 4.1s / 400s · 15 / 2.5 hits | 486 dps · 4.1s / 408s · 13.4 / 2 hits | 543 dps · 3.8s / 410s · 11.3 / 1.2 hits | 610 dps · 4.5s / 413s · 12.5 / 1.4 hits | 680 dps · 3.6s / 413s · 15.1 / 1.7 hits | 763 dps · 4.6s / 668s · 11.7 / 0.8 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 454 + weapon 29 · Z2 Meteor, Void Rift, Arcane Beam; spells 562 + weapon 36 · Z3 Meteor, Void Rift, Arcane Beam; spells 684 + weapon 43 · Z4 Meteor, Void Rift, Arcane Beam; spells 762 + weapon 47 · Z5 Meteor, Void Rift, Arcane Beam; spells 844 + weapon 51 · Z6 Meteor, Void Rift, Arcane Beam; spells 939 + weapon 56 · Z7 Meteor, Void Rift, Arcane Beam; spells 1,038 + weapon 61 · Z8 Meteor, Void Rift, Arcane Beam; spells 1,153 + weapon 65
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 145 + weapon 135 · Z2 Sunray, Purify; spells 181 + weapon 170 · Z3 Sunray, Purify; spells 222 + weapon 210 · Z4 Sunray, Purify; spells 249 + weapon 237 · Z5 Sunray, Purify; spells 277 + weapon 265 · Z6 Sunray, Purify; spells 311 + weapon 299 · Z7 Sunray, Purify; spells 346 + weapon 334 · Z8 Sunray, Purify; spells 387 + weapon 375

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 246 | 173 | 493 | 2.9 |
| 2 | 252 | 172 | 496 | 2.9 |
| 3 | 238 | 161 | 464 | 2.9 |
| 4 | 245 | 161 | 461 | 2.9 |
| 5 | 244 | 161 | 461 | 2.9 |
| 6 | 244 | 162 | 461 | 2.8 |
| 7 | 245 | 163 | 462 | 2.8 |
| 8 | 393 | 263 | 741 | 2.8 |

### NG+2

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 2,295 dps · 2.4s / 263s · 18.3 / 2.1 hits | 2,684 dps · 2s / 264s · 15.1 / 2.1 hits | 3,143 dps · 1.9s / 265s · 16.8 / 2.8 hits | 3,381 dps · 2.1s / 265s · 14.2 / 2.2 hits | 3,744 dps · 2s / 261s · 11.2 / 1.2 hits | 4,028 dps · 2.5s / 262s · 12.2 / 1.4 hits | 4,229 dps · 2.2s / 263s · 14.6 / 1.7 hits | 4,432 dps · 2.9s / 361s · 10.8 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 2,029 dps · 2.8s / 297s · 15.3 / 1.7 hits | 2,399 dps · 2.2s / 295s · 12.6 / 1.7 hits | 2,846 dps · 2.1s / 292s · 13.9 / 2.3 hits | 3,083 dps · 2.2s / 291s · 11.8 / 1.8 hits | 3,407 dps · 2.2s / 287s · 9.4 / 1 hits ⚠1-shot | 3,697 dps · 2.7s / 286s · 10.2 / 1.2 hits | 3,885 dps · 2.4s / 286s · 12.2 / 1.4 hits | 4,075 dps · 3.2s / 392s · 9 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 1,620 dps · 3.4s / 372s · 19 / 2.1 hits | 1,864 dps · 2.8s / 380s · 15.8 / 2.2 hits | 2,154 dps · 2.8s / 386s · 17.5 / 2.9 hits | 2,313 dps · 3s / 388s · 14.8 / 2.3 hits | 2,506 dps · 3s / 390s · 11.8 / 1.2 hits | 2,728 dps · 3.7s / 388s · 12.6 / 1.4 hits | 2,958 dps · 3.2s / 376s · 15.2 / 1.7 hits | 3,245 dps · 4s / 492s · 11.2 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 1,541 dps · 3.6s / 391s · 15.1 / 1.7 hits | 1,808 dps · 2.9s / 392s · 12.4 / 1.7 hits | 2,126 dps · 2.8s / 392s · 13.7 / 2.3 hits | 2,291 dps · 3s / 392s · 11.6 / 1.8 hits | 2,503 dps · 3s / 391s · 9.2 / 1 hits ⚠1-shot | 2,699 dps · 3.7s / 392s · 10 / 1.1 hits | 2,832 dps · 3.3s / 393s · 12.1 / 1.4 hits | 2,993 dps · 4.3s / 534s · 8.9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 818 dps · 6.8s / 738s · 18.3 / 2.1 hits | 959 dps · 5.5s / 739s · 15.1 / 2.1 hits | 1,128 dps · 5.3s / 738s · 16.8 / 2.8 hits | 1,216 dps · 5.7s / 738s · 14.2 / 2.2 hits | 1,329 dps · 5.7s / 736s · 11.2 / 1.2 hits | 1,433 dps · 7s / 738s · 12.2 / 1.4 hits | 1,505 dps · 6.3s / 739s · 14.6 / 1.7 hits | 1,577 dps · 8.2s / 1,014s · 10.8 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 1,438 dps · 3.9s / 420s · 15.1 / 1.7 hits | 1,667 dps · 3.2s / 425s · 12.4 / 1.7 hits | 1,934 dps · 3.1s / 430s · 13.7 / 2.3 hits | 2,045 dps · 3.4s / 439s · 11.8 / 1.8 hits | 2,140 dps · 3.5s / 457s · 9.4 / 1 hits ⚠1-shot | 2,235 dps · 4.5s / 473s · 10.2 / 1.2 hits | 2,330 dps · 4s / 477s · 12.1 / 1.4 hits | 2,426 dps · 5.3s / 659s · 9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 913 dps · 6.1s / 661s · 15.3 / 1.7 hits | 1,067 dps · 5s / 665s · 12.6 / 1.7 hits | 1,247 dps · 4.8s / 667s · 13.9 / 2.3 hits | 1,336 dps · 5.2s / 671s · 12 / 1.8 hits | 1,402 dps · 5.4s / 698s · 9.5 / 1 hits | 1,468 dps · 6.9s / 720s · 10.3 / 1.2 hits | 1,535 dps · 6.1s / 724s · 12.2 / 1.4 hits | 1,602 dps · 8.1s / 998s · 9.1 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 1,362 + weapon 75 · Z2 Meteor, Void Rift, Arcane Beam; spells 1,581 + weapon 86 · Z3 Meteor, Void Rift, Arcane Beam; spells 1,835 + weapon 99 · Z4 Meteor, Void Rift, Arcane Beam; spells 1,939 + weapon 105 · Z5 Meteor, Void Rift, Arcane Beam; spells 2,028 + weapon 112 · Z6 Meteor, Void Rift, Arcane Beam; spells 2,117 + weapon 118 · Z7 Meteor, Void Rift, Arcane Beam; spells 2,206 + weapon 125 · Z8 Meteor, Void Rift, Arcane Beam; spells 2,294 + weapon 131
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 460 + weapon 453 · Z2 Sunray, Purify; spells 536 + weapon 530 · Z3 Sunray, Purify; spells 625 + weapon 622 · Z4 Sunray, Purify; spells 668 + weapon 668 · Z5 Sunray, Purify; spells 698 + weapon 703 · Z6 Sunray, Purify; spells 729 + weapon 739 · Z7 Sunray, Purify; spells 760 + weapon 775 · Z8 Sunray, Purify; spells 790 + weapon 812

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 391 | 263 | 738 | 2.8 |
| 2 | 392 | 264 | 739 | 2.8 |
| 3 | 392 | 265 | 738 | 2.8 |
| 4 | 392 | 265 | 738 | 2.8 |
| 5 | 391 | 261 | 736 | 2.8 |
| 6 | 392 | 262 | 738 | 2.8 |
| 7 | 393 | 263 | 739 | 2.8 |
| 8 | 534 | 361 | 1,014 | 2.8 |

### NG+3

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 4,917 dps · 2.5s / 273s · 21.8 / 2.5 hits | 5,445 dps · 2s / 271s · 17.1 / 2.3 hits | 5,983 dps · 1.9s / 274s · 18.4 / 3.1 hits | 6,214 dps · 2s / 268s · 15.3 / 2.3 hits | 6,465 dps · 2.1s / 262s · 11.6 / 1.2 hits | 6,699 dps · 2.5s / 258s · 12.2 / 1.4 hits | 6,955 dps · 2.2s / 253s · 13.8 / 1.6 hits | 7,212 dps · 2.8s / 342s · 9.8 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 4,523 dps · 2.7s / 297s · 18.3 / 2.1 hits | 5,028 dps · 2.2s / 293s · 14.4 / 2 hits | 5,527 dps · 2.1s / 296s · 15.4 / 2.6 hits | 5,743 dps · 2.2s / 290s · 12.8 / 2 hits | 5,981 dps · 2.2s / 283s · 9.8 / 1 hits | 6,217 dps · 2.7s / 278s · 10.3 / 1.2 hits | 6,460 dps · 2.4s / 272s · 11.7 / 1.3 hits | 6,705 dps · 3s / 368s · 8.3 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 3,747 dps · 3.3s / 359s · 22.6 / 2.6 hits | 4,271 dps · 2.6s / 345s · 18 / 2.5 hits | 4,872 dps · 2.4s / 336s · 19.1 / 3.2 hits | 5,246 dps · 2.4s / 318s · 15.9 / 2.4 hits | 5,603 dps · 2.4s / 302s · 12.1 / 1.3 hits | 6,055 dps · 2.8s / 286s · 12.6 / 1.4 hits | 6,517 dps · 2.3s / 270s · 14.5 / 1.7 hits | 6,975 dps · 2.9s / 353s · 10.2 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 3,320 dps · 3.7s / 405s · 18 / 2 hits | 3,674 dps · 3s / 401s · 14.2 / 1.9 hits | 4,036 dps · 2.9s / 405s · 15.2 / 2.5 hits | 4,191 dps · 3s / 397s · 12.7 / 1.9 hits | 4,359 dps · 3.1s / 389s · 9.7 / 1 hits | 4,515 dps · 3.7s / 383s · 10.2 / 1.2 hits | 4,685 dps · 3.2s / 376s · 11.5 / 1.3 hits | 4,857 dps · 4.1s / 508s · 8.2 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 1,770 dps · 7s / 759s · 21.8 / 2.5 hits | 1,960 dps · 5.6s / 752s · 17.1 / 2.3 hits | 2,154 dps · 5.4s / 760s · 18.4 / 3.1 hits | 2,237 dps · 5.7s / 745s · 15.3 / 2.3 hits | 2,327 dps · 5.8s / 728s · 11.6 / 1.2 hits | 2,411 dps · 7s / 717s · 12.2 / 1.4 hits | 2,503 dps · 6.1s / 703s · 13.8 / 1.6 hits | 2,596 dps · 7.8s / 950s · 9.8 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 2,682 dps · 4.6s / 501s · 18.3 / 2.1 hits | 2,953 dps · 3.7s / 499s · 14.2 / 1.9 hits | 3,235 dps · 3.6s / 506s · 15.2 / 2.5 hits | 3,349 dps · 3.8s / 497s · 12.7 / 1.9 hits | 3,464 dps · 3.9s / 489s · 9.7 / 1 hits | 3,578 dps · 4.7s / 483s · 10.2 / 1.2 hits | 3,693 dps · 4.1s / 476s · 11.7 / 1.3 hits | 3,808 dps · 5.3s / 647s · 8.3 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 1,776 dps · 6.9s / 757s · 18.5 / 2.1 hits | 1,964 dps · 5.6s / 751s · 14.4 / 2 hits | 2,157 dps · 5.4s / 759s · 15.4 / 2.6 hits | 2,248 dps · 5.6s / 741s · 12.8 / 2 hits | 2,330 dps · 5.7s / 727s · 9.8 / 1 hits | 2,413 dps · 7s / 717s · 10.3 / 1.2 hits | 2,496 dps · 6.1s / 705s · 11.8 / 1.4 hits | 2,579 dps · 7.8s / 956s · 8.4 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 2,535 + weapon 147 · Z2 Meteor, Void Rift, Arcane Beam; spells 2,787 + weapon 165 · Z3 Meteor, Void Rift, Arcane Beam; spells 3,051 + weapon 184 · Z4 Meteor, Void Rift, Arcane Beam; spells 3,156 + weapon 193 · Z5 Meteor, Void Rift, Arcane Beam; spells 3,262 + weapon 202 · Z6 Meteor, Void Rift, Arcane Beam; spells 3,368 + weapon 211 · Z7 Meteor, Void Rift, Arcane Beam; spells 3,473 + weapon 220 · Z8 Meteor, Void Rift, Arcane Beam; spells 3,579 + weapon 229
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 873 + weapon 903 · Z2 Sunray, Purify; spells 960 + weapon 1,004 · Z3 Sunray, Purify; spells 1,051 + weapon 1,106 · Z4 Sunray, Purify; spells 1,087 + weapon 1,161 · Z5 Sunray, Purify; spells 1,123 + weapon 1,207 · Z6 Sunray, Purify; spells 1,160 + weapon 1,253 · Z7 Sunray, Purify; spells 1,196 + weapon 1,300 · Z8 Sunray, Purify; spells 1,233 + weapon 1,347

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 405 | 273 | 759 | 2.8 |
| 2 | 401 | 271 | 752 | 2.8 |
| 3 | 405 | 274 | 760 | 2.8 |
| 4 | 397 | 268 | 745 | 2.8 |
| 5 | 389 | 262 | 728 | 2.8 |
| 6 | 383 | 258 | 717 | 2.8 |
| 7 | 376 | 253 | 705 | 2.8 |
| 8 | 508 | 342 | 956 | 2.8 |

### NG+4

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 7,850 dps · 2.5s / 263s · 23.9 / 2.7 hits | 8,538 dps · 2s / 268s · 18.4 / 2.5 hits | 9,232 dps · 1.9s / 273s · 19.3 / 3.2 hits | 9,539 dps · 2.1s / 273s · 15.8 / 2.4 hits | 9,822 dps · 2.1s / 271s · 11.9 / 1.3 hits | 10,162 dps · 2.6s / 269s · 12.3 / 1.4 hits | 10,593 dps · 2.2s / 265s · 13.8 / 1.6 hits | 10,914 dps · 2.9s / 362s · 9.7 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 7,300 dps · 2.6s / 283s · 20.1 / 2.3 hits | 7,967 dps · 2.2s / 287s · 15.5 / 2.1 hits | 8,618 dps · 2.1s / 293s · 16.3 / 2.7 hits | 8,912 dps · 2.2s / 292s · 13.4 / 2.1 hits | 9,180 dps · 2.3s / 290s · 10.1 / 1.1 hits | 9,479 dps · 2.8s / 289s · 10.5 / 1.2 hits | 9,781 dps · 2.4s / 287s · 12.1 / 1.4 hits | 10,115 dps · 3.2s / 391s · 8.5 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 7,827 dps · 2.5s / 264s · 25 / 2.8 hits | 8,769 dps · 2s / 261s · 19.3 / 2.6 hits | 9,757 dps · 1.8s / 259s · 20.1 / 3.4 hits | 10,296 dps · 1.9s / 253s · 16.6 / 2.5 hits | 10,896 dps · 1.9s / 244s · 12.5 / 1.3 hits | 11,545 dps · 2.3s / 237s · 13 / 1.5 hits | 12,215 dps · 1.9s / 230s · 14.9 / 1.7 hits | 13,029 dps · 2.4s / 304s · 10.5 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 5,285 dps · 3.7s / 390s · 19.9 / 2.3 hits | 5,746 dps · 3s / 398s · 15.4 / 2.1 hits | 6,211 dps · 2.9s / 406s · 16.2 / 2.7 hits | 6,415 dps · 3.1s / 406s · 13.2 / 2 hits | 6,604 dps · 3.1s / 403s · 10 / 1.1 hits | 6,811 dps · 3.9s / 402s · 10.4 / 1.2 hits | 7,067 dps · 3.3s / 397s · 12 / 1.4 hits | 7,296 dps · 4.4s / 542s · 8.5 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 2,825 dps · 6.8s / 731s · 23.9 / 2.7 hits | 3,073 dps · 5.6s / 744s · 18.4 / 2.5 hits | 3,322 dps · 5.3s / 760s · 19.3 / 3.2 hits | 3,433 dps · 5.8s / 759s · 15.8 / 2.4 hits | 3,534 dps · 5.9s / 752s · 11.9 / 1.3 hits | 3,656 dps · 7.3s / 748s · 12.3 / 1.4 hits | 3,769 dps · 6.2s / 745s · 13.8 / 1.6 hits | 3,883 dps · 8.2s / 1,019s · 9.7 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 4,135 dps · 4.7s / 499s · 19.9 / 2.3 hits | 4,474 dps · 3.9s / 511s · 15.4 / 2.1 hits | 4,825 dps · 3.7s / 523s · 16.2 / 2.7 hits | 4,959 dps · 4s / 525s · 13.2 / 2 hits | 5,093 dps · 4.1s / 522s · 10 / 1.1 hits | 5,228 dps · 5.1s / 523s · 10.5 / 1.2 hits | 5,366 dps · 4.4s / 523s · 12 / 1.4 hits | 5,503 dps · 5.8s / 719s · 8.5 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 2,813 dps · 6.9s / 734s · 20.1 / 2.3 hits | 3,050 dps · 5.7s / 749s · 15.5 / 2.1 hits | 3,296 dps · 5.4s / 766s · 16.3 / 2.7 hits | 3,395 dps · 5.9s / 767s · 13.4 / 2.1 hits | 3,494 dps · 5.9s / 761s · 10.1 / 1.1 hits | 3,594 dps · 7.4s / 761s · 10.6 / 1.2 hits | 3,716 dps · 6.3s / 755s · 12.1 / 1.4 hits | 3,826 dps · 8.3s / 1,034s · 8.5 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 3,882 + weapon 253 · Z2 Meteor, Void Rift, Arcane Beam; spells 4,197 + weapon 277 · Z3 Meteor, Void Rift, Arcane Beam; spells 4,523 + weapon 303 · Z4 Meteor, Void Rift, Arcane Beam; spells 4,645 + weapon 314 · Z5 Meteor, Void Rift, Arcane Beam; spells 4,768 + weapon 325 · Z6 Meteor, Void Rift, Arcane Beam; spells 4,891 + weapon 337 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,014 + weapon 352 · Z8 Meteor, Void Rift, Arcane Beam; spells 5,136 + weapon 367
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,337 + weapon 1,476 · Z2 Sunray, Purify; spells 1,445 + weapon 1,605 · Z3 Sunray, Purify; spells 1,558 + weapon 1,738 · Z4 Sunray, Purify; spells 1,600 + weapon 1,795 · Z5 Sunray, Purify; spells 1,642 + weapon 1,852 · Z6 Sunray, Purify; spells 1,684 + weapon 1,910 · Z7 Sunray, Purify; spells 1,727 + weapon 1,989 · Z8 Sunray, Purify; spells 1,769 + weapon 2,057

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 390 | 263 | 734 | 2.8 |
| 2 | 398 | 261 | 749 | 2.9 |
| 3 | 406 | 259 | 766 | 3 |
| 4 | 406 | 253 | 767 | 3 |
| 5 | 403 | 244 | 761 | 3.1 |
| 6 | 402 | 237 | 761 | 3.2 |
| 7 | 397 | 230 | 755 | 3.3 |
| 8 | 542 | 304 | 1,034 | 3.4 |

### NG+5

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 11,208 dps · 2.1s / 226s · 26.8 / 3.1 hits | 11,534 dps · 1.9s / 247s · 19.6 / 2.7 hits | 11,861 dps · 1.9s / 268s · 19.5 / 3.3 hits | 12,160 dps · 2.1s / 271s · 16 / 2.5 hits | 12,491 dps · 2.1s / 269s · 12 / 1.3 hits | 12,793 dps · 2.6s / 269s · 12.5 / 1.4 hits | 13,128 dps · 2.3s / 269s · 14.3 / 1.7 hits | 13,465 dps · 3s / 370s · 10 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 10,391 dps · 2.3s / 244s · 23.5 / 2.7 hits | 10,700 dps · 2s / 266s · 17.2 / 2.4 hits | 11,036 dps · 2s / 288s · 17.2 / 2.9 hits | 11,318 dps · 2.2s / 291s · 14.1 / 2.2 hits | 11,634 dps · 2.3s / 289s · 10.5 / 1.1 hits | 11,919 dps · 2.8s / 289s · 11 / 1.2 hits | 12,239 dps · 2.4s / 288s · 12.6 / 1.5 hits | 12,561 dps · 3.2s / 396s · 8.7 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 13,746 dps · 1.7s / 184s · 29 / 3.3 hits | 14,535 dps · 1.5s / 196s · 21.2 / 2.9 hits | 15,297 dps · 1.5s / 208s · 21.1 / 3.5 hits | 16,042 dps · 1.6s / 205s · 17.3 / 2.7 hits | 16,755 dps · 1.6s / 201s · 13 / 1.4 hits | 17,295 dps · 1.9s / 199s · 13.5 / 1.5 hits | 17,787 dps · 1.7s / 198s · 15.4 / 1.8 hits | 18,198 dps · 2.2s / 273s · 10.8 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 7,491 dps · 3.1s / 338s · 23.5 / 2.7 hits | 7,704 dps · 2.8s / 370s · 17.2 / 2.4 hits | 7,920 dps · 2.9s / 402s · 17.2 / 2.9 hits | 8,117 dps · 3.1s / 405s · 14.1 / 2.2 hits | 8,335 dps · 3.1s / 403s · 10.5 / 1.1 hits | 8,535 dps · 3.9s / 404s · 11 / 1.2 hits | 8,754 dps · 3.4s / 403s · 12.6 / 1.5 hits | 8,975 dps · 4.5s / 554s · 8.7 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 3,987 dps · 5.9s / 635s · 26.8 / 3.1 hits | 4,103 dps · 5.3s / 695s · 19.6 / 2.7 hits | 4,219 dps · 5.4s / 754s · 19.5 / 3.3 hits | 4,363 dps · 5.8s / 754s · 16 / 2.5 hits | 4,481 dps · 5.8s / 750s · 12 / 1.3 hits | 4,589 dps · 7.2s / 751s · 12.5 / 1.4 hits | 4,709 dps · 6.3s / 749s · 14.3 / 1.7 hits | 4,830 dps · 8.3s / 1,030s · 10 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 5,638 dps · 4.1s / 449s · 23.5 / 2.7 hits | 5,778 dps · 3.8s / 493s · 17.2 / 2.4 hits | 5,917 dps · 3.8s / 538s · 17.2 / 2.9 hits | 6,049 dps · 4.2s / 544s · 14.1 / 2.2 hits | 6,185 dps · 4.2s / 544s · 10.5 / 1.1 hits | 6,320 dps · 5.2s / 545s · 11 / 1.2 hits | 6,460 dps · 4.6s / 546s · 12.6 / 1.5 hits | 6,596 dps · 6.1s / 754s · 8.7 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 3,928 dps · 6s / 645s · 23.5 / 2.7 hits | 4,040 dps · 5.4s / 706s · 17.2 / 2.4 hits | 4,152 dps · 5.4s / 766s · 17.2 / 2.9 hits | 4,245 dps · 6s / 775s · 14.1 / 2.2 hits | 4,349 dps · 6s / 773s · 10.5 / 1.1 hits | 4,453 dps · 7.4s / 774s · 11 / 1.2 hits | 4,567 dps · 6.5s / 773s · 12.6 / 1.5 hits | 4,672 dps · 8.6s / 1,065s · 8.7 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 5,259 + weapon 379 · Z2 Meteor, Void Rift, Arcane Beam; spells 5,382 + weapon 397 · Z3 Meteor, Void Rift, Arcane Beam; spells 5,504 + weapon 413 · Z4 Meteor, Void Rift, Arcane Beam; spells 5,627 + weapon 422 · Z5 Meteor, Void Rift, Arcane Beam; spells 5,750 + weapon 435 · Z6 Meteor, Void Rift, Arcane Beam; spells 5,872 + weapon 448 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,995 + weapon 465 · Z8 Meteor, Void Rift, Arcane Beam; spells 6,118 + weapon 478
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,811 + weapon 2,117 · Z2 Sunray, Purify; spells 1,853 + weapon 2,186 · Z3 Sunray, Purify; spells 1,896 + weapon 2,256 · Z4 Sunray, Purify; spells 1,938 + weapon 2,307 · Z5 Sunray, Purify; spells 1,980 + weapon 2,369 · Z6 Sunray, Purify; spells 2,022 + weapon 2,430 · Z7 Sunray, Purify; spells 2,065 + weapon 2,503 · Z8 Sunray, Purify; spells 2,107 + weapon 2,565

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 338 | 184 | 645 | 3.5 |
| 2 | 370 | 196 | 706 | 3.6 |
| 3 | 402 | 208 | 766 | 3.7 |
| 4 | 405 | 205 | 775 | 3.8 |
| 5 | 403 | 201 | 773 | 3.9 |
| 6 | 404 | 199 | 774 | 3.9 |
| 7 | 403 | 198 | 773 | 3.9 |
| 8 | 554 | 273 | 1,065 | 3.9 |

### NG+6

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 13,837 dps · 2s / 224s · 27.9 / 3.2 hits | 14,146 dps · 1.9s / 244s · 20.3 / 2.8 hits | 14,489 dps · 1.9s / 267s · 20.2 / 3.4 hits | 14,834 dps · 2.1s / 268s · 16.5 / 2.5 hits | 15,147 dps · 2.1s / 268s · 12.3 / 1.3 hits | 15,530 dps · 2.6s / 269s · 12.8 / 1.5 hits | 15,847 dps · 2.2s / 269s · 14.6 / 1.7 hits | 16,199 dps · 3s / 371s · 10.1 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 12,920 dps · 2.2s / 240s · 24.5 / 2.8 hits | 13,212 dps · 2s / 261s · 17.9 / 2.5 hits | 13,571 dps · 2s / 285s · 17.8 / 3 hits | 13,902 dps · 2.2s / 286s · 14.5 / 2.2 hits | 14,200 dps · 2.2s / 286s · 10.8 / 1.1 hits | 14,571 dps · 2.7s / 287s · 11.3 / 1.3 hits | 14,835 dps · 2.4s / 288s · 12.8 / 1.5 hits | 15,099 dps · 3.2s / 398s · 8.9 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 18,696 dps · 1.5s / 166s · 30.2 / 3.4 hits | 19,155 dps · 1.4s / 180s · 22 / 3 hits | 19,672 dps · 1.4s / 196s · 21.9 / 3.7 hits | 20,137 dps · 1.6s / 197s · 17.9 / 2.8 hits | 20,515 dps · 1.5s / 198s · 13.3 / 1.4 hits | 21,029 dps · 1.9s / 199s · 13.8 / 1.6 hits | 21,455 dps · 1.7s / 199s · 15.8 / 1.8 hits | 21,837 dps · 2.2s / 275s · 10.9 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 9,218 dps · 3s / 336s · 24.5 / 2.8 hits | 9,421 dps · 2.9s / 366s · 17.9 / 2.5 hits | 9,646 dps · 2.8s / 400s · 17.8 / 3 hits | 9,872 dps · 3.2s / 403s · 14.5 / 2.2 hits | 10,078 dps · 3.1s / 403s · 10.8 / 1.1 hits | 10,327 dps · 3.9s / 405s · 11.3 / 1.3 hits | 10,535 dps · 3.4s / 405s · 12.8 / 1.5 hits | 10,744 dps · 4.5s / 560s · 8.9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 4,963 dps · 5.6s / 624s · 27.9 / 3.2 hits | 5,073 dps · 5.3s / 679s · 20.3 / 2.8 hits | 5,196 dps · 5.2s / 743s · 20.2 / 3.4 hits | 5,320 dps · 5.9s / 747s · 16.5 / 2.5 hits | 5,432 dps · 5.8s / 748s · 12.3 / 1.3 hits | 5,569 dps · 7.2s / 751s · 12.8 / 1.5 hits | 5,682 dps · 6.3s / 751s · 14.6 / 1.7 hits | 5,808 dps · 8.3s / 1,035s · 10.1 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 6,740 dps · 4.1s / 460s · 24.5 / 2.8 hits | 6,876 dps · 3.9s / 501s · 17.9 / 2.5 hits | 7,013 dps · 3.9s / 551s · 17.8 / 3 hits | 7,150 dps · 4.4s / 556s · 14.5 / 2.2 hits | 7,286 dps · 4.3s / 558s · 10.8 / 1.1 hits | 7,427 dps · 5.4s / 563s · 11.3 / 1.3 hits | 7,564 dps · 4.7s / 564s · 12.8 / 1.5 hits | 7,708 dps · 6.3s / 780s · 8.9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 4,799 dps · 5.8s / 646s · 24.5 / 2.8 hits | 4,905 dps · 5.5s / 703s · 17.9 / 2.5 hits | 5,011 dps · 5.4s / 771s · 17.8 / 3 hits | 5,117 dps · 6.1s / 777s · 14.5 / 2.2 hits | 5,224 dps · 6s / 778s · 10.8 / 1.1 hits | 5,343 dps · 7.5s / 783s · 11.3 / 1.3 hits | 5,451 dps · 6.5s / 783s · 12.8 / 1.5 hits | 5,587 dps · 8.7s / 1,076s · 8.9 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 6,241 + weapon 499 · Z2 Meteor, Void Rift, Arcane Beam; spells 6,363 + weapon 513 · Z3 Meteor, Void Rift, Arcane Beam; spells 6,486 + weapon 527 · Z4 Meteor, Void Rift, Arcane Beam; spells 6,609 + weapon 541 · Z5 Meteor, Void Rift, Arcane Beam; spells 6,731 + weapon 555 · Z6 Meteor, Void Rift, Arcane Beam; spells 6,854 + weapon 573 · Z7 Meteor, Void Rift, Arcane Beam; spells 6,977 + weapon 588 · Z8 Meteor, Void Rift, Arcane Beam; spells 7,099 + weapon 609
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,149 + weapon 2,650 · Z2 Sunray, Purify; spells 2,192 + weapon 2,713 · Z3 Sunray, Purify; spells 2,234 + weapon 2,777 · Z4 Sunray, Purify; spells 2,276 + weapon 2,841 · Z5 Sunray, Purify; spells 2,318 + weapon 2,906 · Z6 Sunray, Purify; spells 2,361 + weapon 2,983 · Z7 Sunray, Purify; spells 2,403 + weapon 3,048 · Z8 Sunray, Purify; spells 2,445 + weapon 3,142

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 336 | 166 | 646 | 3.9 |
| 2 | 366 | 180 | 703 | 3.9 |
| 3 | 400 | 196 | 771 | 3.9 |
| 4 | 403 | 197 | 777 | 3.9 |
| 5 | 403 | 198 | 778 | 3.9 |
| 6 | 405 | 199 | 783 | 3.9 |
| 7 | 405 | 199 | 783 | 3.9 |
| 8 | 560 | 275 | 1,076 | 3.9 |

### NG+7

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 16,482 dps · 2s / 224s · 29.6 / 3.4 hits | 16,765 dps · 1.9s / 245s · 21.6 / 3 hits | 17,048 dps · 1.9s / 268s · 21.4 / 3.6 hits | 17,331 dps · 2.1s / 271s · 17.4 / 2.7 hits | 17,615 dps · 2.1s / 271s · 13 / 1.4 hits | 17,898 dps · 2.6s / 273s · 13.4 / 1.5 hits | 18,181 dps · 2.3s / 274s · 15.3 / 1.8 hits | 18,464 dps · 3s / 378s · 10.6 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 15,363 dps · 2.2s / 240s · 26 / 3 hits | 15,627 dps · 2s / 263s · 18.9 / 2.6 hits | 15,891 dps · 2s / 288s · 18.8 / 3.1 hits | 16,155 dps · 2.2s / 290s · 15.3 / 2.4 hits | 16,419 dps · 2.3s / 291s · 11.4 / 1.2 hits | 16,682 dps · 2.8s / 293s · 11.8 / 1.3 hits | 16,946 dps · 2.5s / 294s · 13.4 / 1.6 hits | 17,210 dps · 3.3s / 406s · 9.3 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 22,219 dps · 1.5s / 166s · 32 / 3.7 hits | 22,600 dps · 1.4s / 182s · 23.3 / 3.2 hits | 22,982 dps · 1.4s / 199s · 23.1 / 3.9 hits | 23,364 dps · 1.5s / 201s · 18.8 / 2.9 hits | 23,745 dps · 1.6s / 201s · 14 / 1.5 hits | 24,127 dps · 2s / 203s · 14.5 / 1.6 hits | 24,508 dps · 1.7s / 203s · 16.6 / 1.9 hits | 24,890 dps · 2.3s / 281s · 11.4 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 10,932 dps · 3s / 338s · 26 / 3 hits | 11,119 dps · 2.8s / 370s · 18.9 / 2.6 hits | 11,307 dps · 2.9s / 404s · 18.8 / 3.1 hits | 11,495 dps · 3.1s / 408s · 15.3 / 2.4 hits | 11,683 dps · 3.2s / 409s · 11.4 / 1.2 hits | 11,870 dps · 4s / 412s · 11.8 / 1.3 hits | 12,058 dps · 3.5s / 413s · 13.4 / 1.6 hits | 12,246 dps · 4.6s / 570s · 9.3 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 5,910 dps · 5.6s / 624s · 29.6 / 3.4 hits | 6,011 dps · 5.2s / 684s · 21.6 / 3 hits | 6,113 dps · 5.3s / 748s · 21.4 / 3.6 hits | 6,214 dps · 5.8s / 755s · 17.4 / 2.7 hits | 6,316 dps · 5.9s / 757s · 13 / 1.4 hits | 6,417 dps · 7.4s / 762s · 13.4 / 1.5 hits | 6,519 dps · 6.5s / 764s · 15.3 / 1.8 hits | 6,620 dps · 8.5s / 1,055s · 10.6 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 7,850 dps · 4.2s / 470s · 26 / 3 hits | 7,988 dps · 3.9s / 515s · 18.9 / 2.6 hits | 8,125 dps · 4s / 563s · 18.8 / 3.1 hits | 8,268 dps · 4.4s / 567s · 15.3 / 2.4 hits | 8,406 dps · 4.4s / 569s · 11.4 / 1.2 hits | 8,544 dps · 5.5s / 572s · 11.8 / 1.3 hits | 8,687 dps · 4.9s / 573s · 13.4 / 1.6 hits | 8,830 dps · 6.4s / 791s · 9.3 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 5,708 dps · 5.8s / 646s · 26 / 3 hits | 5,818 dps · 5.4s / 706s · 18.9 / 2.6 hits | 5,928 dps · 5.5s / 771s · 18.8 / 3.1 hits | 6,050 dps · 6s / 775s · 15.3 / 2.4 hits | 6,161 dps · 6.1s / 776s · 11.4 / 1.2 hits | 6,272 dps · 7.5s / 779s · 11.8 / 1.3 hits | 6,396 dps · 6.6s / 778s · 13.4 / 1.6 hits | 6,521 dps · 8.6s / 1,071s · 9.3 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 7,222 + weapon 628 · Z2 Meteor, Void Rift, Arcane Beam; spells 7,345 + weapon 643 · Z3 Meteor, Void Rift, Arcane Beam; spells 7,468 + weapon 658 · Z4 Meteor, Void Rift, Arcane Beam; spells 7,590 + weapon 677 · Z5 Meteor, Void Rift, Arcane Beam; spells 7,713 + weapon 693 · Z6 Meteor, Void Rift, Arcane Beam; spells 7,836 + weapon 708 · Z7 Meteor, Void Rift, Arcane Beam; spells 7,959 + weapon 728 · Z8 Meteor, Void Rift, Arcane Beam; spells 8,081 + weapon 749
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,487 + weapon 3,221 · Z2 Sunray, Purify; spells 2,530 + weapon 3,288 · Z3 Sunray, Purify; spells 2,572 + weapon 3,356 · Z4 Sunray, Purify; spells 2,614 + weapon 3,436 · Z5 Sunray, Purify; spells 2,656 + weapon 3,505 · Z6 Sunray, Purify; spells 2,699 + weapon 3,574 · Z7 Sunray, Purify; spells 2,741 + weapon 3,656 · Z8 Sunray, Purify; spells 2,783 + weapon 3,738

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 338 | 166 | 646 | 3.9 |
| 2 | 370 | 182 | 706 | 3.9 |
| 3 | 404 | 199 | 771 | 3.9 |
| 4 | 408 | 201 | 775 | 3.9 |
| 5 | 409 | 201 | 776 | 3.9 |
| 6 | 412 | 203 | 779 | 3.8 |
| 7 | 413 | 203 | 778 | 3.8 |
| 8 | 570 | 281 | 1,071 | 3.8 |

### NG+10

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 23,276 dps · 2.4s / 262s · 12 / 1.4 hits | 23,559 dps · 2.2s / 288s · 8.7 / 1.2 hits | 23,843 dps · 2.2s / 317s · 8.6 / 1.4 hits | 24,126 dps · 2.5s / 321s · 7 / 1.1 hits | 24,409 dps · 2.5s / 323s · 5.1 / 0.5 hits ⚠1-shot | 24,692 dps · 3.2s / 327s · 5.3 / 0.6 hits ⚠1-shot | 24,975 dps · 2.8s / 329s · 6 / 0.7 hits ⚠1-shot | 25,258 dps · 3.7s / 456s · 4.1 / 0.3 hits ⚠1-shot |
| Slicey: twin daggers | 21,696 dps · 2.6s / 281s · 10.5 / 1.2 hits | 21,960 dps · 2.3s / 309s · 7.6 / 1 hits | 22,224 dps · 2.4s / 340s · 7.5 / 1.3 hits | 22,487 dps · 2.7s / 344s · 6.1 / 0.9 hits ⚠1-shot | 22,751 dps · 2.7s / 347s · 4.5 / 0.5 hits ⚠1-shot | 23,015 dps · 3.4s / 350s · 4.7 / 0.5 hits ⚠1-shot | 23,279 dps · 3s / 353s · 5.3 / 0.6 hits ⚠1-shot | 23,543 dps · 3.9s / 490s · 3.6 / 0.2 hits ⚠1-shot |
| Quality: longsword + shield | 31,377 dps · 1.8s / 194s · 13 / 1.5 hits | 31,759 dps · 1.6s / 214s · 9.4 / 1.3 hits | 32,141 dps · 1.7s / 235s · 9.3 / 1.6 hits | 32,522 dps · 1.8s / 238s · 7.5 / 1.2 hits | 32,904 dps · 1.9s / 240s · 5.6 / 0.6 hits ⚠1-shot | 33,286 dps · 2.3s / 242s · 5.7 / 0.7 hits ⚠1-shot | 33,667 dps · 2.1s / 244s · 6.5 / 0.8 hits ⚠1-shot | 34,049 dps · 2.7s / 339s · 4.5 / 0.3 hits ⚠1-shot |
| Bow (Slicey) | 15,438 dps · 3.7s / 395s · 10.5 / 1.2 hits | 15,625 dps · 3.3s / 434s · 7.6 / 1 hits | 15,813 dps · 3.4s / 477s · 7.5 / 1.3 hits | 16,001 dps · 3.7s / 484s · 6.1 / 0.9 hits ⚠1-shot | 16,189 dps · 3.8s / 487s · 4.5 / 0.5 hits ⚠1-shot | 16,376 dps · 4.8s / 493s · 4.7 / 0.5 hits ⚠1-shot | 16,564 dps · 4.2s / 496s · 5.3 / 0.6 hits ⚠1-shot | 16,752 dps · 5.5s / 688s · 3.6 / 0.2 hits ⚠1-shot |
| Crossbow (Bonk) | 8,346 dps · 6.8s / 731s · 12 / 1.4 hits | 8,447 dps · 6.1s / 803s · 8.7 / 1.2 hits | 8,549 dps · 6.2s / 883s · 8.6 / 1.4 hits | 8,650 dps · 6.9s / 895s · 7 / 1.1 hits | 8,752 dps · 7s / 901s · 5.1 / 0.5 hits ⚠1-shot | 8,853 dps · 8.8s / 911s · 5.3 / 0.6 hits ⚠1-shot | 8,955 dps · 7.8s / 918s · 6 / 0.7 hits ⚠1-shot | 9,056 dps · 10.2s / 1,273s · 4.1 / 0.3 hits ⚠1-shot |
| Brain caster: staff spells | 11,175 dps · 5s / 546s · 10.5 / 1.2 hits | 11,311 dps · 4.6s / 600s · 7.6 / 1 hits | 11,445 dps · 4.7s / 659s · 7.5 / 1.3 hits | 11,580 dps · 5.2s / 669s · 6.1 / 0.9 hits ⚠1-shot | 11,715 dps · 5.3s / 673s · 4.5 / 0.5 hits ⚠1-shot | 11,850 dps · 6.6s / 681s · 4.7 / 0.5 hits ⚠1-shot | 11,985 dps · 5.8s / 686s · 5.3 / 0.6 hits ⚠1-shot | 12,120 dps · 7.6s / 951s · 3.6 / 0.2 hits ⚠1-shot |
| Prayer caster: talisman spells | 8,370 dps · 6.7s / 729s · 10.5 / 1.2 hits | 8,471 dps · 6.1s / 801s · 7.6 / 1 hits | 8,573 dps · 6.2s / 880s · 7.5 / 1.3 hits | 8,674 dps · 6.9s / 893s · 6.1 / 0.9 hits ⚠1-shot | 8,775 dps · 7s / 899s · 4.5 / 0.5 hits ⚠1-shot | 8,877 dps · 8.8s / 909s · 4.7 / 0.5 hits ⚠1-shot | 8,978 dps · 7.8s / 915s · 5.3 / 0.6 hits ⚠1-shot | 9,080 dps · 10.2s / 1,269s · 3.6 / 0.2 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 10,167 + weapon 1,008 · Z2 Meteor, Void Rift, Arcane Beam; spells 10,290 + weapon 1,021 · Z3 Meteor, Void Rift, Arcane Beam; spells 10,413 + weapon 1,033 · Z4 Meteor, Void Rift, Arcane Beam; spells 10,535 + weapon 1,045 · Z5 Meteor, Void Rift, Arcane Beam; spells 10,658 + weapon 1,057 · Z6 Meteor, Void Rift, Arcane Beam; spells 10,781 + weapon 1,070 · Z7 Meteor, Void Rift, Arcane Beam; spells 10,904 + weapon 1,082 · Z8 Meteor, Void Rift, Arcane Beam; spells 11,026 + weapon 1,094
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 3,502 + weapon 4,868 · Z2 Sunray, Purify; spells 3,544 + weapon 4,927 · Z3 Sunray, Purify; spells 3,586 + weapon 4,987 · Z4 Sunray, Purify; spells 3,628 + weapon 5,046 · Z5 Sunray, Purify; spells 3,671 + weapon 5,105 · Z6 Sunray, Purify; spells 3,713 + weapon 5,164 · Z7 Sunray, Purify; spells 3,755 + weapon 5,223 · Z8 Sunray, Purify; spells 3,797 + weapon 5,283

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 395 | 194 | 731 | 3.8 |
| 2 | 434 | 214 | 803 | 3.8 |
| 3 | 477 | 235 | 883 | 3.8 |
| 4 | 484 | 238 | 895 | 3.8 |
| 5 | 487 | 240 | 901 | 3.8 |
| 6 | 493 | 242 | 911 | 3.8 |
| 7 | 496 | 244 | 918 | 3.8 |
| 8 | 688 | 339 | 1,273 | 3.8 |

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
| Leech | weapon | 0.4% of max HP healed a hit (lifesteal) | — | heals 1.1% max HP per 10 s of attacking |
| Vigor | weapon | −16% stamina costs | +5% sustained, +0% burst DPS |  |
| Bulwark | armour | +16 defense to all types | +5% effective HP |  |
| Hearth | armour | +8% max HP | +5% effective HP |  |
| Zephyr | armour | +16% stamina regeneration | — |  |
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
| Katana | D/A | 2H | 694 | 266 | 318 | 15.5 | Iai Slash 82, Crescent 49, Blood Moon 0 | ⚠ 1.72× median DPS |
| Bow | -/B | 2H | 359 | 132 | 344 | 34.5 | Volley 95, Piercing Shot 48, Rain 18 |  |
| Whip | -/E | 1H | 345 | 137 | 224 | 20.7 | Lash 64, Crack 34, Serpent Coil 65 |  |
| Longsword | B/B | 2H | 571 | 209 | 324 | 20.7 | Shield Breaker 67, Spin Slash 38, Battle Cry 0 | ⚠ 1.35× median DPS |
| Spear | C/B | 2H | 423 | 145 | 255 | 24.2 | Impale 71, Sweep 34, Phalanx 0 |  |
| Battleaxe | A/D | 2H | 503 | 171 | 388 | 31.1 | Cleave 75, Hook 33, Frenzy 0 |  |
| Mace | B/E | 2H | 493 | 170 | 389 | 31.1 | Holy Smite 74, Consecrate 40, Judgment 27 |  |
| Halberd | A/C | 2H | 414 | 143 | 311 | 29.3 | Moulinet 92, Hook Pull 32, Vault 40 |  |
| Twin Axes | C/B | 2H | 651 | 262 | 433 | 20.7 | Whirlwind 127, Throw 57, Rampage 0 | ⚠ 1.7× median DPS |
| Hollow Maul | B/-/Br B | 2H | 372 | 127 | 391 | 41.4 | Singularity 57, Event Horizon 86, Null Shell 0 |  |
| Spellblade | -/B/Br B | 1H | 422 | 174 | 271 | 19 | Arc Wave 48, Blink Strike 43, Runic Edge 0 |  |
| Censer Flail | B/-/Pr B | 2H | 453 | 155 | 351 | 31.1 | Incense 61, Brimstone 52, Sanctified Flame 0 |  |
| Dawn Glaive | -/B/Pr B | 1H | 437 | 151 | 312 | 27.6 | Sunrise 64, Halo Throw 39, Judgement Ray 43 |  |
| Chakrams | E/B | 2H | 381 | 124 | 214 | 24.2 | Orbit 63, Ring Storm 12, Grand Ring 22 |  |

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
| NG+1 | 40,954 → L84 | 34,882 → L90 | 37,760 → L96 | 34,115 → L102 | 38,788 → L108 | 40,022 → L115 | 47,582 → L122 | 42,447 → L130 |
| NG+2 | 45,227 → L137 | 39,408 → L143 | 42,090 → L150 | 37,165 → L156 | 42,785 → L163 | 45,177 → L170 | 53,067 → L178 | 45,671 → L186 |
| NG+3 | 49,237 → L193 | 42,440 → L201 | 45,635 → L208 | 41,476 → L215 | 47,728 → L222 | 50,622 → L230 | 57,748 → L239 | 49,919 → L247 |
| NG+4 | 54,137 → L255 | 47,787 → L263 | 51,053 → L270 | 44,866 → L278 | 52,266 → L285 | 54,327 → L293 | 62,783 → L302 | 56,229 → L312 |
| NG+5 | 60,409 → L321 | 53,211 → L329 | 55,162 → L337 | 49,161 → L345 | 56,378 → L352 | 58,810 → L361 | 71,458 → L371 | 60,768 → L381 |
| NG+6 | 66,172 → L390 | 56,247 → L399 | 61,743 → L408 | 56,622 → L416 | 62,266 → L425 | 66,585 → L434 | 76,188 → L445 | 68,155 → L455 |
| NG+7 | 74,076 → L466 | 62,486 → L476 | 66,585 → L485 | 59,839 → L493 | 66,844 → L502 | 71,919 → L511 | 84,120 → L522 | 75,031 → L533 |
| NG+10 | 94,486 → L717 | 80,546 → L728 | 89,679 → L739 | 80,277 → L749 | 92,125 → L760 | 94,603 → L772 | 113,628 → L785 | 98,547 → L798 |

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
| NG+1 | 1 | L84 | 586 | 1,949 | 3.3 | 665 | 45 | 14.8 | 1.64 | 1.13 |  |
| NG+1 | 2 | L90 | 720 | 1,762 | 2.4 | 685 | 62 | 11 | 1.21 | 0.84 |  |
| NG+1 | 3 | L96 | 874 | 1,760 | 2 | 705 | 60 | 11.7 | 0.99 | 0.89 |  |
| NG+1 | 4 | L102 | 966 | 1,983 | 2.1 | 725 | 60 | 12.1 | 1.01 | 0.92 |  |
| NG+1 | 5 | L108 | 1,060 | 2,065 | 1.9 | 745 | 69 | 10.9 | 0.96 | 0.83 |  |
| NG+1 | 6 | L115 | 1,163 | 2,753 | 2.4 | 765 | 73 | 10.4 | 1.17 | 0.8 |  |
| NG+1 | 7 | L122 | 1,268 | 2,464 | 1.9 | 785 | 61 | 12.9 | 0.96 | 0.98 |  |
| NG+1 | 8 | L130 | 1,383 | 3,481 | 2.5 | 805 | 86 | 9.4 | 1.24 | 0.72 |  |
| NG+2 | 1 | L137 | 1,620 | 5,585 | 3.4 | 825 | 56 | 14.7 | 1.7 | 1.12 |  |
| NG+2 | 2 | L143 | 1,864 | 5,281 | 2.8 | 854 | 79 | 10.9 | 1.4 | 0.83 |  |
| NG+2 | 3 | L150 | 2,154 | 5,963 | 2.8 | 883 | 81 | 10.9 | 1.36 | 0.83 |  |
| NG+2 | 4 | L156 | 2,313 | 6,935 | 3 | 912 | 85 | 10.8 | 1.48 | 0.82 |  |
| NG+2 | 5 | L163 | 2,506 | 7,566 | 3 | 941 | 104 | 9.1 | 1.49 | 0.69 |  |
| NG+2 | 6 | L170 | 2,728 | 10,091 | 3.7 | 970 | 115 | 8.4 | 1.82 | 0.64 |  |
| NG+2 | 7 | L178 | 2,958 | 9,429 | 3.2 | 1,014 | 98 | 10.3 | 1.57 | 0.79 |  |
| NG+2 | 8 | L186 | 3,245 | 12,920 | 4 | 1,043 | 146 | 7.2 | 1.96 | 0.55 |  |
| NG+3 | 1 | L193 | 3,747 | 12,318 | 3.3 | 1,072 | 61 | 17.5 | 1.62 | 1.33 |  |
| NG+3 | 2 | L201 | 4,271 | 10,968 | 2.6 | 1,115 | 90 | 12.4 | 1.26 | 0.95 |  |
| NG+3 | 3 | L208 | 4,872 | 11,551 | 2.4 | 1,144 | 97 | 11.8 | 1.17 | 0.9 |  |
| NG+3 | 4 | L215 | 5,246 | 12,652 | 2.4 | 1,173 | 102 | 11.5 | 1.19 | 0.88 |  |
| NG+3 | 5 | L222 | 5,603 | 13,389 | 2.4 | 1,202 | 128 | 9.4 | 1.18 | 0.72 |  |
| NG+3 | 6 | L230 | 6,055 | 16,840 | 2.8 | 1,231 | 146 | 8.4 | 1.37 | 0.64 |  |
| NG+3 | 7 | L239 | 6,517 | 15,193 | 2.3 | 1,275 | 130 | 9.8 | 1.15 | 0.75 |  |
| NG+3 | 8 | L247 | 6,975 | 20,132 | 2.9 | 1,304 | 199 | 6.6 | 1.42 | 0.5 |  |
| NG+4 | 1 | L255 | 7,827 | 19,317 | 2.5 | 1,347 | 70 | 19.3 | 1.22 | 1.47 |  |
| NG+4 | 2 | L263 | 8,769 | 17,287 | 2 | 1,376 | 104 | 13.3 | 0.97 | 1.01 |  |
| NG+4 | 3 | L270 | 9,757 | 17,759 | 1.8 | 1,405 | 113 | 12.4 | 0.9 | 0.94 |  |
| NG+4 | 4 | L278 | 10,296 | 20,038 | 1.9 | 1,449 | 120 | 12 | 0.96 | 0.92 |  |
| NG+4 | 5 | L285 | 10,896 | 20,678 | 1.9 | 1,478 | 153 | 9.7 | 0.93 | 0.74 |  |
| NG+4 | 6 | L293 | 11,545 | 26,699 | 2.3 | 1,507 | 173 | 8.7 | 1.14 | 0.67 |  |
| NG+4 | 7 | L302 | 12,215 | 23,519 | 1.9 | 1,536 | 152 | 10.1 | 0.95 | 0.77 |  |
| NG+4 | 8 | L312 | 13,029 | 31,917 | 2.4 | 1,536 | 230 | 6.7 | 1.21 | 0.51 |  |
| NG+5 | 1 | L321 | 13,746 | 23,380 | 1.7 | 1,536 | 69 | 22.3 | 0.84 | 1.7 |  |
| NG+5 | 2 | L329 | 14,535 | 21,758 | 1.5 | 1,536 | 105 | 14.6 | 0.74 | 1.11 |  |
| NG+5 | 3 | L337 | 15,297 | 22,616 | 1.5 | 1,536 | 118 | 13 | 0.73 | 0.99 |  |
| NG+5 | 4 | L345 | 16,042 | 25,399 | 1.6 | 1,536 | 122 | 12.6 | 0.78 | 0.96 |  |
| NG+5 | 5 | L352 | 16,755 | 26,210 | 1.6 | 1,536 | 153 | 10.1 | 0.77 | 0.77 |  |
| NG+5 | 6 | L361 | 17,295 | 32,869 | 1.9 | 1,536 | 170 | 9.1 | 0.94 | 0.69 |  |
| NG+5 | 7 | L371 | 17,787 | 29,709 | 1.7 | 1,536 | 146 | 10.5 | 0.82 | 0.8 |  |
| NG+5 | 8 | L381 | 18,198 | 39,949 | 2.2 | 1,536 | 224 | 6.9 | 1.08 | 0.52 |  |
| NG+6 | 1 | L390 | 18,696 | 27,962 | 1.5 | 1,536 | 66 | 23.3 | 0.74 | 1.78 |  |
| NG+6 | 2 | L399 | 19,155 | 26,927 | 1.4 | 1,536 | 101 | 15.1 | 0.69 | 1.15 |  |
| NG+6 | 3 | L408 | 19,672 | 27,119 | 1.4 | 1,536 | 114 | 13.5 | 0.68 | 1.03 |  |
| NG+6 | 4 | L416 | 20,137 | 31,234 | 1.6 | 1,536 | 118 | 13 | 0.76 | 0.99 |  |
| NG+6 | 5 | L425 | 20,515 | 31,394 | 1.5 | 1,536 | 149 | 10.3 | 0.75 | 0.79 |  |
| NG+6 | 6 | L434 | 21,029 | 39,993 | 1.9 | 1,536 | 166 | 9.3 | 0.94 | 0.71 |  |
| NG+6 | 7 | L445 | 21,455 | 35,545 | 1.7 | 1,536 | 143 | 10.7 | 0.82 | 0.82 |  |
| NG+6 | 8 | L455 | 21,837 | 48,413 | 2.2 | 1,536 | 220 | 7 | 1.09 | 0.53 |  |
| NG+7 | 1 | L466 | 22,219 | 33,261 | 1.5 | 1,536 | 62 | 24.7 | 0.74 | 1.88 |  |
| NG+7 | 2 | L476 | 22,600 | 31,208 | 1.4 | 1,536 | 96 | 16 | 0.68 | 1.22 |  |
| NG+7 | 3 | L485 | 22,982 | 32,369 | 1.4 | 1,536 | 108 | 14.2 | 0.69 | 1.09 |  |
| NG+7 | 4 | L493 | 23,364 | 36,200 | 1.5 | 1,536 | 112 | 13.7 | 0.76 | 1.04 |  |
| NG+7 | 5 | L502 | 23,745 | 37,356 | 1.6 | 1,536 | 142 | 10.8 | 0.77 | 0.83 |  |
| NG+7 | 6 | L511 | 24,127 | 47,345 | 2 | 1,536 | 158 | 9.7 | 0.97 | 0.74 |  |
| NG+7 | 7 | L522 | 24,508 | 42,209 | 1.7 | 1,536 | 137 | 11.2 | 0.85 | 0.86 |  |
| NG+7 | 8 | L533 | 24,890 | 56,110 | 2.3 | 1,536 | 211 | 7.3 | 1.11 | 0.56 |  |
| NG+10 | 1 | L717 | 31,377 | 56,365 | 1.8 | 1,536 | 154 | 10 | 0.88 | 0.76 |  |
| NG+10 | 2 | L728 | 31,759 | 51,511 | 1.6 | 1,536 | 238 | 6.5 | 0.8 | 0.49 | ⚠ survives 2× fewer hits |
| NG+10 | 3 | L739 | 32,141 | 53,428 | 1.7 | 1,536 | 269 | 5.7 | 0.82 | 0.44 | ⚠ survives 2.3× fewer hits |
| NG+10 | 4 | L749 | 32,522 | 59,750 | 1.8 | 1,536 | 282 | 5.5 | 0.9 | 0.42 | ⚠ survives 2.4× fewer hits |
| NG+10 | 5 | L760 | 32,904 | 61,658 | 1.9 | 1,536 | 357 | 4.3 | 0.92 | 0.33 | ⚠ survives 3× fewer hits |
| NG+10 | 6 | L772 | 33,286 | 78,146 | 2.3 | 1,536 | 400 | 3.8 | 1.16 | 0.29 | ⚠ survives 3.4× fewer hits |
| NG+10 | 7 | L785 | 33,667 | 69,669 | 2.1 | 1,536 | 347 | 4.4 | 1.02 | 0.34 | ⚠ survives 3× fewer hits |
| NG+10 | 8 | L798 | 34,049 | 92,613 | 2.7 | 1,536 | 540 | 2.8 | 1.34 | 0.22 | ⚠ survives 4.6× fewer hits |

