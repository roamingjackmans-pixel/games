# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Bonk: greathammer (2H) build (767 HP) in one hit (0.97). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
2. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Slicey: twin daggers build (648 HP) in one hit (0.82). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
3. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 2,878 void) kills the Bow (Slicey) build (640 HP) in one hit (0.81). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
4. **Boss length** (severity 5.8): NG+10 zone 8: the median build needs 826 s of nonstop hitting to kill The Landlord (11,525,707 HP), 13.8 minutes before any dodging (target 11 min, D301). *Suggested:* Trim its NG_BOSS_HP factor (D301), the boss HP multiplier for this cycle, or the extra phase bars.
5. **Build spread** (severity 4.8): NG+6 zone 7: the slowest build (Prayer caster: talisman spells) takes 863 s on the boss, 3.6× the fastest (Bonk: greathammer (2H), 242 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
6. **Build spread** (severity 4.8): NG+6 zone 6: the slowest build (Prayer caster: talisman spells) takes 863 s on the boss, 3.6× the fastest (Bonk: greathammer (2H), 242 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
7. **Build spread** (severity 4.8): NG+6 zone 8: the slowest build (Prayer caster: talisman spells) takes 1,187 s on the boss, 3.6× the fastest (Bonk: greathammer (2H), 334 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
8. **Gems** (severity 4.8): Quicksilver raises sustained DPS by +2% (burst +7%) where Brutal gives +6% (0.38× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
9. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
10. **Weapon skills** (severity 4.1): Colossal Sword's skills deal 273 damage per second of cooldown, 2.04× the median weapon's (134). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
11. **Weapon skills** (severity 4.1): Greathammer's skills deal 273 damage per second of cooldown, 2.04× the median weapon's (134). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
12. **Enemy curve** (severity 3.8): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 108. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
13. **Spells** (severity 3.5): Arcane Beam (brain): 16.4 damage per busy second at Spell Skill 100, 2.05× the brain median (8). *Suggested:* Lengthen its cooldown or lower its base.
14. **Weapons** (severity 3.4): Greathammer: 205 sustained light-attack DPS, 1.39× the median weapon (147) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
15. **Enemy curve** (severity 3.4): NG+4: zone 7 room enemies have 23,519 HP on average, below zone 6's 26,699. *Suggested:* Check the zone roster mix and the HP curve.
16. **Enemy curve** (severity 3.3): NG+6: zone 7 room enemies have 35,545 HP on average, below zone 6's 39,993. *Suggested:* Check the zone roster mix and the HP curve.
17. **Enemy curve** (severity 3.2): NG+3: zone 2 room enemies have 10,968 HP on average, below zone 1's 12,318. *Suggested:* Check the zone roster mix and the HP curve.
18. **Gear power** (severity 3): Reinforcement reaches ×3.25 at +15, while the whole rarity ladder is ×1.28: a +15 common out-hits a +0 legendary 2.5×, so drops matter little once reinforcement starts. *Suggested:* Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.

(121 more findings of the same kinds are in the tables below.)

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
| Bonk: greathammer (2H) | 37 dps · 2.5s / 69s · 17.7 / 3.7 hits | 59 dps · 2.1s / 95s · 23.2 / 3.1 hits | 89 dps · 1.9s / 85s · 19.4 / 3.9 hits | 137 dps · 1.6s / 77s · 17.8 / 3.2 hits | 215 dps · 1.2s / 79s · 15.4 / 2.2 hits | 344 dps · 1s / 55s · 16.6 / 2.8 hits | 444 dps · 0.8s / 47s · 17.6 / 3 hits | 564 dps · 0.9s / 100s · 18.2 / 1.4 hits |
| Slicey: twin daggers | 23 dps · 3.9s / 110s · 13 / 2.7 hits | 37 dps · 3.4s / 153s · 17.4 / 2.4 hits | 56 dps · 3s / 136s · 14.8 / 3 hits | 87 dps · 2.5s / 121s · 13.8 / 2.5 hits | 124 dps · 2s / 138s · 12.1 / 1.7 hits | 183 dps · 1.9s / 103s · 13.2 / 2.2 hits | 220 dps · 1.6s / 96s · 14.2 / 2.4 hits | 263 dps · 2s / 214s · 15.2 / 1.1 hits |
| Quality: longsword + shield | 33 dps · 2.7s / 76s · 16.8 / 3.5 hits | 51 dps · 2.4s / 109s · 22.4 / 3 hits | 77 dps · 2.2s / 99s · 19 / 3.8 hits | 116 dps · 1.9s / 90s · 17.7 / 3.2 hits | 165 dps · 1.5s / 104s · 15.5 / 2.2 hits | 240 dps · 1.5s / 79s · 16.7 / 2.8 hits | 288 dps · 1.2s / 73s · 18 / 3 hits | 335 dps · 1.6s / 168s · 18.9 / 1.4 hits |
| Bow (Slicey) | 26 dps · 3.5s / 97s · 12.2 / 2.5 hits | 40 dps · 3s / 138s · 16.5 / 2.2 hits | 60 dps · 2.8s / 126s · 14.1 / 2.8 hits | 95 dps · 2.3s / 111s · 13.3 / 2.4 hits | 134 dps · 1.9s / 128s · 11.7 / 1.7 hits | 195 dps · 1.8s / 97s · 12.7 / 2.1 hits | 231 dps · 1.5s / 91s · 13.8 / 2.3 hits | 267 dps · 2s / 211s · 14.8 / 1.1 hits |
| Crossbow (Bonk) | 27 dps · 3.3s / 94s · 17.7 / 3.7 hits | 42 dps · 2.9s / 134s · 23.2 / 3.1 hits | 62 dps · 2.7s / 122s · 19.4 / 3.9 hits | 94 dps · 2.3s / 112s · 17.8 / 3.2 hits | 137 dps · 1.8s / 125s · 15.4 / 2.2 hits | 199 dps · 1.8s / 95s · 16.6 / 2.8 hits | 236 dps · 1.5s / 89s · 17.6 / 3 hits | 279 dps · 1.9s / 202s · 18.2 / 1.4 hits |
| Brain caster: staff spells | 36 dps · 2.5s / 69s · 12.2 / 2.5 hits | 63 dps · 2s / 89s · 16.5 / 2.2 hits | 95 dps · 1.8s / 80s · 14.1 / 2.8 hits | 137 dps · 1.6s / 77s · 13.3 / 2.4 hits | 188 dps · 1.3s / 91s · 11.7 / 1.7 hits | 264 dps · 1.3s / 71s · 12.7 / 2.1 hits | 315 dps · 1.1s / 67s · 13.8 / 2.3 hits | 369 dps · 1.4s / 153s · 14.8 / 1.1 hits |
| Prayer caster: talisman spells | 33 dps · 2.7s / 75s · 13 / 2.7 hits | 31 dps · 3.9s / 178s · 17.4 / 2.4 hits | 46 dps · 3.6s / 166s · 14.8 / 3 hits | 68 dps · 3.2s / 154s · 13.8 / 2.5 hits | 95 dps · 2.7s / 180s · 12.1 / 1.7 hits | 136 dps · 2.6s / 138s · 13.2 / 2.2 hits | 163 dps · 2.2s / 129s · 14.2 / 2.4 hits | 195 dps · 2.7s / 289s · 15.2 / 1.1 hits |

- Brain caster: staff spells: Z1 Void Rift, Frost Lance, Fireball; spells 33 + weapon 3 · Z2 Void Rift, Arcane Beam, Frost Lance; spells 61 + weapon 2 · Z3 Meteor, Void Rift, Arcane Beam; spells 90 + weapon 5 · Z4 Meteor, Void Rift, Arcane Beam; spells 130 + weapon 7 · Z5 Meteor, Void Rift, Arcane Beam; spells 178 + weapon 9 · Z6 Meteor, Void Rift, Arcane Beam; spells 251 + weapon 13 · Z7 Meteor, Void Rift, Arcane Beam; spells 299 + weapon 15 · Z8 Meteor, Void Rift, Arcane Beam; spells 351 + weapon 18
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 13 + weapon 20 · Z2 Sunray, Purify; spells 19 + weapon 12 · Z3 Sunray, Purify; spells 27 + weapon 18 · Z4 Sunray, Purify; spells 40 + weapon 28 · Z5 Sunray, Purify; spells 55 + weapon 40 · Z6 Sunray, Purify; spells 78 + weapon 58 · Z7 Sunray, Purify; spells 93 + weapon 70 · Z8 Sunray, Purify; spells 111 + weapon 84

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 76 | 69 | 110 | 1.6 |
| 2 | 134 | 89 | 178 | 2 |
| 3 | 122 | 80 | 166 | 2.1 |
| 4 | 111 | 77 | 154 | 2 |
| 5 | 125 | 79 | 180 | 2.3 |
| 6 | 95 | 55 | 138 | 2.5 |
| 7 | 89 | 47 | 129 | 2.7 |
| 8 | 202 | 100 | 289 | 2.9 |

### NG+1

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 763 dps · 2.6s / 156s · 18.2 / 2 hits | 971 dps · 1.8s / 155s · 15.3 / 2.1 hits | 1,197 dps · 1.5s / 145s · 17.9 / 3 hits | 1,366 dps · 1.5s / 145s · 15.9 / 2.4 hits | 1,538 dps · 1.3s / 145s · 13.5 / 1.4 hits | 1,729 dps · 1.6s / 146s · 14.8 / 1.7 hits | 1,918 dps · 1.3s / 147s · 17.9 / 2 hits | 2,153 dps · 1.6s / 237s · 13.9 / 1 hits ⚠1-shot |
| Slicey: twin daggers | 358 dps · 5.4s / 332s · 15.3 / 1.7 hits | 458 dps · 3.8s / 329s · 12.8 / 1.8 hits | 565 dps · 3.1s / 306s · 15 / 2.5 hits | 646 dps · 3.1s / 307s · 13.4 / 2 hits | 735 dps · 2.8s / 303s · 11.3 / 1.2 hits | 840 dps · 3.3s / 300s · 12.5 / 1.4 hits | 942 dps · 2.6s / 299s · 15.1 / 1.7 hits | 1,075 dps · 3.2s / 474s · 11.7 / 0.8 hits ⚠1-shot |
| Quality: longsword + shield | 424 dps · 4.6s / 280s · 18.9 / 2.1 hits | 520 dps · 3.4s / 290s · 15.9 / 2.2 hits | 632 dps · 2.8s / 274s · 18.6 / 3.1 hits | 698 dps · 2.8s / 284s · 16.7 / 2.5 hits | 765 dps · 2.7s / 291s · 14.1 / 1.5 hits | 839 dps · 3.3s / 300s · 15.5 / 1.8 hits | 913 dps · 2.7s / 308s · 18.7 / 2.1 hits | 995 dps · 3.5s / 512s · 14.6 / 1 hits |
| Bow (Slicey) | 364 dps · 5.4s / 327s · 15 / 1.7 hits | 459 dps · 3.8s / 328s · 12.7 / 1.7 hits | 563 dps · 3.1s / 307s · 14.8 / 2.5 hits | 639 dps · 3.1s / 310s · 13.3 / 2 hits | 719 dps · 2.9s / 310s · 11.2 / 1.2 hits | 814 dps · 3.4s / 309s · 12.3 / 1.4 hits | 907 dps · 2.7s / 310s · 14.9 / 1.7 hits | 1,026 dps · 3.4s / 496s · 11.6 / 0.8 hits ⚠1-shot |
| Crossbow (Bonk) | 371 dps · 5.3s / 320s · 18.2 / 2 hits | 468 dps · 3.8s / 322s · 15.3 / 2.1 hits | 573 dps · 3.1s / 302s · 17.9 / 3 hits | 661 dps · 3s / 300s · 15.9 / 2.4 hits | 743 dps · 2.8s / 300s · 13.5 / 1.4 hits | 841 dps · 3.3s / 300s · 14.8 / 1.7 hits | 936 dps · 2.6s / 300s · 17.9 / 2 hits | 1,058 dps · 3.3s / 481s · 13.9 / 1 hits ⚠1-shot |
| Brain caster: staff spells | 476 dps · 4.1s / 250s · 15 / 1.7 hits | 589 dps · 3s / 256s · 12.7 / 1.7 hits | 717 dps · 2.5s / 241s · 14.8 / 2.5 hits | 798 dps · 2.5s / 248s · 13.3 / 2 hits | 883 dps · 2.3s / 252s · 11.2 / 1.2 hits | 982 dps · 2.8s / 257s · 12.3 / 1.4 hits | 1,084 dps · 2.3s / 259s · 14.9 / 1.7 hits | 1,203 dps · 2.9s / 423s · 11.6 / 0.8 hits ⚠1-shot |
| Prayer caster: talisman spells | 258 dps · 7.6s / 460s · 15.3 / 1.7 hits | 323 dps · 5.5s / 467s · 12.8 / 1.8 hits | 397 dps · 4.4s / 436s · 15 / 2.5 hits | 447 dps · 4.4s / 444s · 13.4 / 2 hits | 499 dps · 4.1s / 447s · 11.3 / 1.2 hits | 560 dps · 4.9s / 450s · 12.5 / 1.4 hits | 625 dps · 3.9s / 450s · 15.1 / 1.7 hits | 700 dps · 5s / 727s · 11.7 / 0.8 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 454 + weapon 22 · Z2 Meteor, Void Rift, Arcane Beam; spells 562 + weapon 27 · Z3 Meteor, Void Rift, Arcane Beam; spells 684 + weapon 33 · Z4 Meteor, Void Rift, Arcane Beam; spells 762 + weapon 36 · Z5 Meteor, Void Rift, Arcane Beam; spells 844 + weapon 39 · Z6 Meteor, Void Rift, Arcane Beam; spells 939 + weapon 43 · Z7 Meteor, Void Rift, Arcane Beam; spells 1,038 + weapon 46 · Z8 Meteor, Void Rift, Arcane Beam; spells 1,153 + weapon 50
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 145 + weapon 113 · Z2 Sunray, Purify; spells 181 + weapon 142 · Z3 Sunray, Purify; spells 222 + weapon 175 · Z4 Sunray, Purify; spells 249 + weapon 197 · Z5 Sunray, Purify; spells 277 + weapon 221 · Z6 Sunray, Purify; spells 311 + weapon 249 · Z7 Sunray, Purify; spells 346 + weapon 278 · Z8 Sunray, Purify; spells 387 + weapon 313

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 320 | 156 | 460 | 3 |
| 2 | 322 | 155 | 467 | 3 |
| 3 | 302 | 145 | 436 | 3 |
| 4 | 300 | 145 | 444 | 3.1 |
| 5 | 300 | 145 | 447 | 3.1 |
| 6 | 300 | 146 | 450 | 3.1 |
| 7 | 300 | 147 | 450 | 3.1 |
| 8 | 481 | 237 | 727 | 3.1 |

### NG+2

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 2,550 dps · 2.2s / 237s · 18.3 / 2.1 hits | 2,982 dps · 1.8s / 238s · 15.1 / 2.1 hits | 3,492 dps · 1.7s / 238s · 16.8 / 2.8 hits | 3,757 dps · 1.8s / 239s · 14.2 / 2.2 hits | 4,160 dps · 1.8s / 235s · 11.2 / 1.2 hits | 4,476 dps · 2.3s / 236s · 12.2 / 1.4 hits | 4,699 dps · 2s / 237s · 14.6 / 1.7 hits | 4,924 dps · 2.6s / 325s · 10.8 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 1,289 dps · 4.3s / 468s · 15.3 / 1.7 hits | 1,521 dps · 3.5s / 466s · 12.6 / 1.7 hits | 1,800 dps · 3.3s / 462s · 13.9 / 2.3 hits | 1,947 dps · 3.6s / 461s · 11.8 / 1.8 hits | 2,145 dps · 3.5s / 456s · 9.4 / 1 hits ⚠1-shot | 2,324 dps · 4.3s / 455s · 10.2 / 1.2 hits | 2,440 dps · 3.9s / 456s · 12.2 / 1.4 hits | 2,558 dps · 5.1s / 625s · 9 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 1,167 dps · 4.8s / 517s · 19 / 2.1 hits | 1,342 dps · 3.9s / 528s · 15.8 / 2.2 hits | 1,537 dps · 3.9s / 542s · 17.5 / 2.9 hits | 1,636 dps · 4.2s / 548s · 14.8 / 2.3 hits | 1,770 dps · 4.3s / 553s · 11.8 / 1.2 hits | 1,922 dps · 5.2s / 550s · 12.6 / 1.4 hits | 2,081 dps · 4.5s / 534s · 15.2 / 1.7 hits | 2,269 dps · 5.7s / 704s · 11.2 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 1,236 dps · 4.5s / 488s · 15.1 / 1.7 hits | 1,451 dps · 3.6s / 488s · 12.4 / 1.7 hits | 1,708 dps · 3.5s / 487s · 13.7 / 2.3 hits | 1,842 dps · 3.8s / 487s · 11.6 / 1.8 hits | 2,014 dps · 3.8s / 486s · 9.2 / 1 hits ⚠1-shot | 2,194 dps · 4.6s / 482s · 9.9 / 1.1 hits | 2,325 dps · 4.1s / 478s · 12.1 / 1.4 hits | 2,436 dps · 5.3s / 656s · 8.9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 1,258 dps · 4.4s / 480s · 18.3 / 2.1 hits | 1,476 dps · 3.6s / 480s · 15.1 / 2.1 hits | 1,735 dps · 3.4s / 480s · 16.8 / 2.8 hits | 1,871 dps · 3.7s / 479s · 14.2 / 2.2 hits | 2,044 dps · 3.7s / 479s · 11.2 / 1.2 hits | 2,205 dps · 4.6s / 479s · 12.2 / 1.4 hits | 2,315 dps · 4.1s / 480s · 14.6 / 1.7 hits | 2,426 dps · 5.3s / 659s · 10.8 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 1,420 dps · 3.9s / 425s · 15.1 / 1.7 hits | 1,647 dps · 3.2s / 430s · 12.4 / 1.7 hits | 1,911 dps · 3.1s / 436s · 13.7 / 2.3 hits | 2,019 dps · 3.4s / 444s · 11.8 / 1.8 hits | 2,113 dps · 3.6s / 463s · 9.4 / 1 hits ⚠1-shot | 2,207 dps · 4.6s / 479s · 10.2 / 1.2 hits | 2,300 dps · 4.1s / 483s · 12.1 / 1.4 hits | 2,394 dps · 5.4s / 668s · 9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 838 dps · 6.7s / 720s · 15.3 / 1.7 hits | 978 dps · 5.4s / 725s · 12.6 / 1.7 hits | 1,144 dps · 5.2s / 728s · 13.9 / 2.3 hits | 1,224 dps · 5.7s / 732s · 12 / 1.8 hits | 1,285 dps · 5.9s / 762s · 9.5 / 1 hits | 1,345 dps · 7.5s / 786s · 10.3 / 1.2 hits | 1,406 dps · 6.7s / 791s · 12.2 / 1.4 hits | 1,467 dps · 8.8s / 1,090s · 9.1 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 1,362 + weapon 58 · Z2 Meteor, Void Rift, Arcane Beam; spells 1,581 + weapon 66 · Z3 Meteor, Void Rift, Arcane Beam; spells 1,835 + weapon 76 · Z4 Meteor, Void Rift, Arcane Beam; spells 1,939 + weapon 80 · Z5 Meteor, Void Rift, Arcane Beam; spells 2,028 + weapon 85 · Z6 Meteor, Void Rift, Arcane Beam; spells 2,117 + weapon 90 · Z7 Meteor, Void Rift, Arcane Beam; spells 2,206 + weapon 95 · Z8 Meteor, Void Rift, Arcane Beam; spells 2,294 + weapon 100
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 460 + weapon 377 · Z2 Sunray, Purify; spells 536 + weapon 442 · Z3 Sunray, Purify; spells 625 + weapon 518 · Z4 Sunray, Purify; spells 668 + weapon 557 · Z5 Sunray, Purify; spells 698 + weapon 586 · Z6 Sunray, Purify; spells 729 + weapon 616 · Z7 Sunray, Purify; spells 760 + weapon 646 · Z8 Sunray, Purify; spells 790 + weapon 677

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 480 | 237 | 720 | 3 |
| 2 | 480 | 238 | 725 | 3 |
| 3 | 480 | 238 | 728 | 3.1 |
| 4 | 479 | 239 | 732 | 3.1 |
| 5 | 479 | 235 | 762 | 3.2 |
| 6 | 479 | 236 | 786 | 3.3 |
| 7 | 480 | 237 | 791 | 3.3 |
| 8 | 659 | 325 | 1,090 | 3.4 |

### NG+3

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 5,464 dps · 2.3s / 246s · 21.8 / 2.5 hits | 6,050 dps · 1.8s / 244s · 17.1 / 2.3 hits | 6,648 dps · 1.7s / 246s · 18.4 / 3.1 hits | 6,904 dps · 1.8s / 241s · 15.3 / 2.3 hits | 7,184 dps · 1.9s / 236s · 11.6 / 1.2 hits | 7,444 dps · 2.3s / 232s · 12.2 / 1.4 hits | 7,727 dps · 2s / 228s · 13.8 / 1.6 hits | 8,014 dps · 2.5s / 308s · 9.8 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 2,838 dps · 4.3s / 474s · 18.3 / 2.1 hits | 3,152 dps · 3.5s / 468s · 14.4 / 2 hits | 3,464 dps · 3.3s / 473s · 15.4 / 2.6 hits | 3,598 dps · 3.5s / 463s · 12.8 / 2 hits | 3,744 dps · 3.6s / 452s · 9.8 / 1 hits | 3,889 dps · 4.3s / 445s · 10.3 / 1.2 hits | 4,039 dps · 3.8s / 436s · 11.7 / 1.3 hits | 4,189 dps · 4.8s / 589s · 8.3 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 2,614 dps · 4.7s / 514s · 22.6 / 2.6 hits | 2,992 dps · 3.7s / 493s · 18 / 2.5 hits | 3,407 dps · 3.4s / 480s · 19.1 / 3.2 hits | 3,662 dps · 3.5s / 455s · 15.9 / 2.4 hits | 3,907 dps · 3.4s / 433s · 12.1 / 1.3 hits | 4,215 dps · 4s / 410s · 12.6 / 1.4 hits | 4,515 dps · 3.4s / 390s · 14.5 / 1.7 hits | 4,826 dps · 4.2s / 511s · 10.2 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 2,702 dps · 4.6s / 497s · 18 / 2 hits | 2,991 dps · 3.7s / 493s · 14.2 / 1.9 hits | 3,286 dps · 3.5s / 498s · 15.2 / 2.5 hits | 3,443 dps · 3.7s / 484s · 12.7 / 1.9 hits | 3,581 dps · 3.7s / 473s · 9.7 / 1 hits | 3,711 dps · 4.5s / 466s · 10.2 / 1.2 hits | 3,851 dps · 3.9s / 457s · 11.5 / 1.3 hits | 3,993 dps · 5s / 617s · 8.2 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 2,723 dps · 4.5s / 494s · 21.8 / 2.5 hits | 3,015 dps · 3.6s / 489s · 17.1 / 2.3 hits | 3,313 dps · 3.5s / 494s · 18.4 / 3.1 hits | 3,441 dps · 3.7s / 484s · 15.3 / 2.3 hits | 3,580 dps · 3.7s / 473s · 11.6 / 1.2 hits | 3,709 dps · 4.5s / 466s · 12.2 / 1.4 hits | 3,851 dps · 3.9s / 457s · 13.8 / 1.6 hits | 3,993 dps · 5s / 617s · 9.8 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 2,647 dps · 4.7s / 508s · 18.3 / 2.1 hits | 2,913 dps · 3.8s / 506s · 14.2 / 1.9 hits | 3,190 dps · 3.6s / 513s · 15.2 / 2.5 hits | 3,303 dps · 3.8s / 504s · 12.7 / 1.9 hits | 3,415 dps · 3.9s / 496s · 9.7 / 1 hits | 3,528 dps · 4.8s / 490s · 10.2 / 1.2 hits | 3,640 dps · 4.2s / 483s · 11.7 / 1.3 hits | 3,753 dps · 5.4s / 657s · 8.3 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 1,625 dps · 7.6s / 827s · 18.5 / 2.1 hits | 1,797 dps · 6.1s / 821s · 14.4 / 2 hits | 1,972 dps · 5.9s / 830s · 15.4 / 2.6 hits | 2,054 dps · 6.2s / 811s · 12.8 / 2 hits | 2,129 dps · 6.3s / 796s · 9.8 / 1 hits | 2,204 dps · 7.6s / 785s · 10.3 / 1.2 hits | 2,279 dps · 6.7s / 772s · 11.8 / 1.4 hits | 2,355 dps · 8.5s / 1,047s · 8.4 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 2,535 + weapon 112 · Z2 Meteor, Void Rift, Arcane Beam; spells 2,787 + weapon 126 · Z3 Meteor, Void Rift, Arcane Beam; spells 3,051 + weapon 140 · Z4 Meteor, Void Rift, Arcane Beam; spells 3,156 + weapon 146 · Z5 Meteor, Void Rift, Arcane Beam; spells 3,262 + weapon 153 · Z6 Meteor, Void Rift, Arcane Beam; spells 3,368 + weapon 160 · Z7 Meteor, Void Rift, Arcane Beam; spells 3,473 + weapon 166 · Z8 Meteor, Void Rift, Arcane Beam; spells 3,579 + weapon 173
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 873 + weapon 752 · Z2 Sunray, Purify; spells 960 + weapon 837 · Z3 Sunray, Purify; spells 1,051 + weapon 922 · Z4 Sunray, Purify; spells 1,087 + weapon 967 · Z5 Sunray, Purify; spells 1,123 + weapon 1,005 · Z6 Sunray, Purify; spells 1,160 + weapon 1,044 · Z7 Sunray, Purify; spells 1,196 + weapon 1,083 · Z8 Sunray, Purify; spells 1,233 + weapon 1,122

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 497 | 246 | 827 | 3.4 |
| 2 | 493 | 244 | 821 | 3.4 |
| 3 | 494 | 246 | 830 | 3.4 |
| 4 | 484 | 241 | 811 | 3.4 |
| 5 | 473 | 236 | 796 | 3.4 |
| 6 | 466 | 232 | 785 | 3.4 |
| 7 | 457 | 228 | 772 | 3.4 |
| 8 | 617 | 308 | 1,047 | 3.4 |

### NG+4

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 8,722 dps · 2.2s / 237s · 23.9 / 2.7 hits | 9,487 dps · 1.8s / 241s · 18.4 / 2.5 hits | 10,257 dps · 1.7s / 246s · 19.3 / 3.2 hits | 10,599 dps · 1.9s / 246s · 15.8 / 2.4 hits | 10,914 dps · 1.9s / 244s · 11.9 / 1.3 hits | 11,291 dps · 2.4s / 242s · 12.3 / 1.4 hits | 11,770 dps · 2s / 238s · 13.8 / 1.6 hits | 12,127 dps · 2.6s / 326s · 9.7 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 4,560 dps · 4.2s / 453s · 20.1 / 2.3 hits | 4,972 dps · 3.5s / 460s · 15.5 / 2.1 hits | 5,376 dps · 3.3s / 469s · 16.3 / 2.7 hits | 5,556 dps · 3.6s / 469s · 13.4 / 2.1 hits | 5,721 dps · 3.6s / 465s · 10.1 / 1.1 hits | 5,904 dps · 4.5s / 464s · 10.5 / 1.2 hits | 6,088 dps · 3.9s / 461s · 12.1 / 1.4 hits | 6,290 dps · 5.1s / 629s · 8.5 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 5,434 dps · 3.6s / 380s · 25 / 2.8 hits | 6,082 dps · 2.8s / 376s · 19.3 / 2.6 hits | 6,760 dps · 2.6s / 373s · 20.1 / 3.4 hits | 7,129 dps · 2.8s / 365s · 16.6 / 2.5 hits | 7,538 dps · 2.7s / 353s · 12.5 / 1.3 hits | 7,981 dps · 3.3s / 343s · 13 / 1.5 hits | 8,438 dps · 2.8s / 333s · 14.9 / 1.7 hits | 8,963 dps · 3.6s / 441s · 10.5 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 4,345 dps · 4.4s / 475s · 19.9 / 2.3 hits | 4,725 dps · 3.7s / 484s · 15.4 / 2.1 hits | 5,108 dps · 3.5s / 494s · 16.2 / 2.7 hits | 5,277 dps · 3.8s / 494s · 13.2 / 2 hits | 5,433 dps · 3.8s / 489s · 10 / 1.1 hits | 5,604 dps · 4.8s / 488s · 10.4 / 1.2 hits | 5,777 dps · 4.1s / 486s · 12 / 1.4 hits | 5,965 dps · 5.4s / 663s · 8.5 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 4,346 dps · 4.4s / 475s · 23.9 / 2.7 hits | 4,727 dps · 3.7s / 484s · 18.4 / 2.5 hits | 5,111 dps · 3.5s / 494s · 19.3 / 3.2 hits | 5,281 dps · 3.8s / 493s · 15.8 / 2.4 hits | 5,437 dps · 3.8s / 489s · 11.9 / 1.3 hits | 5,625 dps · 4.7s / 487s · 12.3 / 1.4 hits | 5,799 dps · 4.1s / 484s · 13.8 / 1.6 hits | 5,974 dps · 5.3s / 662s · 9.7 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 4,074 dps · 4.7s / 507s · 19.9 / 2.3 hits | 4,406 dps · 3.9s / 519s · 15.4 / 2.1 hits | 4,751 dps · 3.7s / 531s · 16.2 / 2.7 hits | 4,883 dps · 4.1s / 533s · 13.2 / 2 hits | 5,014 dps · 4.1s / 530s · 10 / 1.1 hits | 5,145 dps · 5.2s / 532s · 10.5 / 1.2 hits | 5,279 dps · 4.5s / 532s · 12 / 1.4 hits | 5,413 dps · 5.9s / 731s · 8.5 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 2,567 dps · 7.5s / 804s · 20.1 / 2.3 hits | 2,783 dps · 6.2s / 821s · 15.5 / 2.1 hits | 3,006 dps · 5.9s / 840s · 16.3 / 2.7 hits | 3,096 dps · 6.5s / 841s · 13.4 / 2.1 hits | 3,185 dps · 6.5s / 835s · 10.1 / 1.1 hits | 3,276 dps · 8.2s / 835s · 10.6 / 1.2 hits | 3,384 dps · 6.9s / 829s · 12.1 / 1.4 hits | 3,483 dps · 9.2s / 1,136s · 8.5 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 3,882 + weapon 192 · Z2 Meteor, Void Rift, Arcane Beam; spells 4,197 + weapon 209 · Z3 Meteor, Void Rift, Arcane Beam; spells 4,523 + weapon 229 · Z4 Meteor, Void Rift, Arcane Beam; spells 4,645 + weapon 237 · Z5 Meteor, Void Rift, Arcane Beam; spells 4,768 + weapon 246 · Z6 Meteor, Void Rift, Arcane Beam; spells 4,891 + weapon 255 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,014 + weapon 266 · Z8 Meteor, Void Rift, Arcane Beam; spells 5,136 + weapon 277
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,337 + weapon 1,230 · Z2 Sunray, Purify; spells 1,445 + weapon 1,337 · Z3 Sunray, Purify; spells 1,558 + weapon 1,449 · Z4 Sunray, Purify; spells 1,600 + weapon 1,496 · Z5 Sunray, Purify; spells 1,642 + weapon 1,543 · Z6 Sunray, Purify; spells 1,684 + weapon 1,591 · Z7 Sunray, Purify; spells 1,727 + weapon 1,658 · Z8 Sunray, Purify; spells 1,769 + weapon 1,714

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 475 | 237 | 804 | 3.4 |
| 2 | 484 | 241 | 821 | 3.4 |
| 3 | 494 | 246 | 840 | 3.4 |
| 4 | 493 | 246 | 841 | 3.4 |
| 5 | 489 | 244 | 835 | 3.4 |
| 6 | 487 | 242 | 835 | 3.4 |
| 7 | 484 | 238 | 829 | 3.5 |
| 8 | 662 | 326 | 1,136 | 3.5 |

### NG+5

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 12,454 dps · 1.9s / 203s · 26.8 / 3.1 hits | 12,815 dps · 1.7s / 222s · 19.6 / 2.7 hits | 13,179 dps · 1.7s / 241s · 19.5 / 3.3 hits | 13,511 dps · 1.9s / 244s · 16 / 2.5 hits | 13,879 dps · 1.9s / 242s · 12 / 1.3 hits | 14,214 dps · 2.3s / 243s · 12.5 / 1.4 hits | 14,587 dps · 2s / 242s · 14.3 / 1.7 hits | 14,961 dps · 2.7s / 333s · 10 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 6,460 dps · 3.6s / 392s · 23.5 / 2.7 hits | 6,647 dps · 3.3s / 429s · 17.2 / 2.4 hits | 6,851 dps · 3.3s / 464s · 17.2 / 2.9 hits | 7,024 dps · 3.6s / 469s · 14.1 / 2.2 hits | 7,215 dps · 3.6s / 466s · 10.5 / 1.1 hits | 7,390 dps · 4.4s / 466s · 11 / 1.2 hits | 7,584 dps · 3.9s / 465s · 12.6 / 1.5 hits | 7,779 dps · 5.1s / 640s · 8.7 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 9,451 dps · 2.5s / 268s · 29 / 3.3 hits | 9,984 dps · 2.2s / 286s · 21.2 / 2.9 hits | 10,502 dps · 2.2s / 303s · 21.1 / 3.5 hits | 11,006 dps · 2.3s / 299s · 17.3 / 2.7 hits | 11,492 dps · 2.3s / 293s · 13 / 1.4 hits | 11,989 dps · 2.7s / 288s · 13.5 / 1.5 hits | 12,333 dps · 2.4s / 286s · 15.4 / 1.8 hits | 12,619 dps · 3.2s / 394s · 10.8 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 6,125 dps · 3.8s / 414s · 23.5 / 2.7 hits | 6,344 dps · 3.4s / 449s · 17.2 / 2.4 hits | 6,522 dps · 3.5s / 488s · 17.2 / 2.9 hits | 6,686 dps · 3.8s / 492s · 14.1 / 2.2 hits | 6,866 dps · 3.8s / 490s · 10.5 / 1.1 hits | 7,031 dps · 4.7s / 490s · 11 / 1.2 hits | 7,213 dps · 4.1s / 489s · 12.6 / 1.5 hits | 7,397 dps · 5.4s / 673s · 8.7 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 6,134 dps · 3.8s / 413s · 26.8 / 3.1 hits | 6,312 dps · 3.4s / 452s · 19.6 / 2.7 hits | 6,490 dps · 3.5s / 490s · 19.5 / 3.3 hits | 6,712 dps · 3.8s / 490s · 16 / 2.5 hits | 6,894 dps · 3.8s / 488s · 12 / 1.3 hits | 7,061 dps · 4.7s / 488s · 12.5 / 1.4 hits | 7,245 dps · 4.1s / 487s · 14.3 / 1.7 hits | 7,431 dps · 5.4s / 670s · 10 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 5,545 dps · 4.2s / 457s · 23.5 / 2.7 hits | 5,681 dps · 3.8s / 502s · 17.2 / 2.4 hits | 5,815 dps · 3.9s / 547s · 17.2 / 2.9 hits | 5,945 dps · 4.3s / 554s · 14.1 / 2.2 hits | 6,077 dps · 4.3s / 553s · 10.5 / 1.1 hits | 6,210 dps · 5.3s / 555s · 11 / 1.2 hits | 6,345 dps · 4.7s / 556s · 12.6 / 1.5 hits | 6,478 dps · 6.2s / 768s · 8.7 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 3,575 dps · 6.5s / 709s · 23.5 / 2.7 hits | 3,675 dps · 5.9s / 776s · 17.2 / 2.4 hits | 3,776 dps · 6s / 843s · 17.2 / 2.9 hits | 3,861 dps · 6.6s / 853s · 14.1 / 2.2 hits | 3,954 dps · 6.6s / 851s · 10.5 / 1.1 hits | 4,048 dps · 8.1s / 852s · 11 / 1.2 hits | 4,150 dps · 7.2s / 850s · 12.6 / 1.5 hits | 4,245 dps · 9.4s / 1,172s · 8.7 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 5,259 + weapon 286 · Z2 Meteor, Void Rift, Arcane Beam; spells 5,382 + weapon 299 · Z3 Meteor, Void Rift, Arcane Beam; spells 5,504 + weapon 311 · Z4 Meteor, Void Rift, Arcane Beam; spells 5,627 + weapon 318 · Z5 Meteor, Void Rift, Arcane Beam; spells 5,750 + weapon 328 · Z6 Meteor, Void Rift, Arcane Beam; spells 5,872 + weapon 337 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,995 + weapon 350 · Z8 Meteor, Void Rift, Arcane Beam; spells 6,118 + weapon 360
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,811 + weapon 1,764 · Z2 Sunray, Purify; spells 1,853 + weapon 1,822 · Z3 Sunray, Purify; spells 1,896 + weapon 1,880 · Z4 Sunray, Purify; spells 1,938 + weapon 1,923 · Z5 Sunray, Purify; spells 1,980 + weapon 1,974 · Z6 Sunray, Purify; spells 2,022 + weapon 2,025 · Z7 Sunray, Purify; spells 2,065 + weapon 2,086 · Z8 Sunray, Purify; spells 2,107 + weapon 2,138

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 413 | 203 | 709 | 3.5 |
| 2 | 449 | 222 | 776 | 3.5 |
| 3 | 488 | 241 | 843 | 3.5 |
| 4 | 490 | 244 | 853 | 3.5 |
| 5 | 488 | 242 | 851 | 3.5 |
| 6 | 488 | 243 | 852 | 3.5 |
| 7 | 487 | 242 | 850 | 3.5 |
| 8 | 670 | 333 | 1,172 | 3.5 |

### NG+6

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 15,374 dps · 1.8s / 202s · 27.9 / 3.2 hits | 15,717 dps · 1.7s / 219s · 20.3 / 2.8 hits | 16,099 dps · 1.7s / 240s · 20.2 / 3.4 hits | 16,482 dps · 1.9s / 241s · 16.5 / 2.5 hits | 16,830 dps · 1.9s / 241s · 12.3 / 1.3 hits | 17,256 dps · 2.3s / 242s · 12.8 / 1.5 hits | 17,607 dps · 2s / 242s · 14.6 / 1.7 hits | 17,999 dps · 2.7s / 334s · 10.1 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 7,994 dps · 3.5s / 388s · 24.5 / 2.8 hits | 8,172 dps · 3.3s / 422s · 17.9 / 2.5 hits | 8,387 dps · 3.2s / 460s · 17.8 / 3 hits | 8,587 dps · 3.6s / 463s · 14.5 / 2.2 hits | 8,768 dps · 3.6s / 464s · 10.8 / 1.1 hits | 8,990 dps · 4.4s / 465s · 11.3 / 1.3 hits | 9,153 dps · 3.9s / 466s · 12.8 / 1.5 hits | 9,316 dps · 5.2s / 645s · 8.9 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 13,020 dps · 2.1s / 238s · 30.2 / 3.4 hits | 13,341 dps · 2s / 258s · 22 / 3 hits | 13,665 dps · 2s / 283s · 21.9 / 3.7 hits | 13,990 dps · 2.2s / 284s · 17.9 / 2.8 hits | 14,253 dps · 2.2s / 285s · 13.3 / 1.4 hits | 14,614 dps · 2.7s / 286s · 13.8 / 1.6 hits | 14,912 dps · 2.4s / 286s · 15.8 / 1.8 hits | 15,177 dps · 3.2s / 396s · 10.9 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 7,598 dps · 3.7s / 408s · 24.5 / 2.8 hits | 7,766 dps · 3.5s / 444s · 17.9 / 2.5 hits | 7,953 dps · 3.4s / 486s · 17.8 / 3 hits | 8,140 dps · 3.8s / 488s · 14.5 / 2.2 hits | 8,311 dps · 3.8s / 489s · 10.8 / 1.1 hits | 8,518 dps · 4.7s / 491s · 11.3 / 1.3 hits | 8,690 dps · 4.1s / 491s · 12.8 / 1.5 hits | 8,881 dps · 5.5s / 677s · 8.9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 7,635 dps · 3.7s / 406s · 27.9 / 3.2 hits | 7,805 dps · 3.4s / 442s · 20.3 / 2.8 hits | 7,994 dps · 3.4s / 483s · 20.2 / 3.4 hits | 8,184 dps · 3.8s / 486s · 16.5 / 2.5 hits | 8,357 dps · 3.8s / 486s · 12.3 / 1.3 hits | 8,568 dps · 4.7s / 488s · 12.8 / 1.5 hits | 8,742 dps · 4.1s / 488s · 14.6 / 1.7 hits | 8,936 dps · 5.4s / 673s · 10.1 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 6,616 dps · 4.2s / 468s · 24.5 / 2.8 hits | 6,749 dps · 4s / 511s · 17.9 / 2.5 hits | 6,882 dps · 3.9s / 561s · 17.8 / 3 hits | 7,015 dps · 4.5s / 567s · 14.5 / 2.2 hits | 7,148 dps · 4.4s / 569s · 10.8 / 1.1 hits | 7,284 dps · 5.5s / 574s · 11.3 / 1.3 hits | 7,418 dps · 4.8s / 575s · 12.8 / 1.5 hits | 7,556 dps · 6.4s / 796s · 8.9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 4,357 dps · 6.4s / 711s · 24.5 / 2.8 hits | 4,452 dps · 6s / 774s · 17.9 / 2.5 hits | 4,548 dps · 6s / 849s · 17.8 / 3 hits | 4,644 dps · 6.7s / 856s · 14.5 / 2.2 hits | 4,740 dps · 6.6s / 857s · 10.8 / 1.1 hits | 4,846 dps · 8.3s / 863s · 11.3 / 1.3 hits | 4,943 dps · 7.2s / 863s · 12.8 / 1.5 hits | 5,064 dps · 9.6s / 1,187s · 8.9 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 6,241 + weapon 375 · Z2 Meteor, Void Rift, Arcane Beam; spells 6,363 + weapon 385 · Z3 Meteor, Void Rift, Arcane Beam; spells 6,486 + weapon 396 · Z4 Meteor, Void Rift, Arcane Beam; spells 6,609 + weapon 406 · Z5 Meteor, Void Rift, Arcane Beam; spells 6,731 + weapon 417 · Z6 Meteor, Void Rift, Arcane Beam; spells 6,854 + weapon 430 · Z7 Meteor, Void Rift, Arcane Beam; spells 6,977 + weapon 441 · Z8 Meteor, Void Rift, Arcane Beam; spells 7,099 + weapon 456
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,149 + weapon 2,208 · Z2 Sunray, Purify; spells 2,192 + weapon 2,261 · Z3 Sunray, Purify; spells 2,234 + weapon 2,314 · Z4 Sunray, Purify; spells 2,276 + weapon 2,368 · Z5 Sunray, Purify; spells 2,318 + weapon 2,422 · Z6 Sunray, Purify; spells 2,361 + weapon 2,486 · Z7 Sunray, Purify; spells 2,403 + weapon 2,540 · Z8 Sunray, Purify; spells 2,445 + weapon 2,619

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 406 | 202 | 711 | 3.5 |
| 2 | 442 | 219 | 774 | 3.5 |
| 3 | 483 | 240 | 849 | 3.5 |
| 4 | 486 | 241 | 856 | 3.5 |
| 5 | 486 | 241 | 857 | 3.6 |
| 6 | 488 | 242 | 863 | 3.6 |
| 7 | 488 | 242 | 863 | 3.6 |
| 8 | 673 | 334 | 1,187 | 3.6 |

### NG+7

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 18,314 dps · 1.8s / 202s · 29.6 / 3.4 hits | 18,628 dps · 1.7s / 221s · 21.6 / 3 hits | 18,943 dps · 1.7s / 241s · 21.4 / 3.6 hits | 19,257 dps · 1.9s / 244s · 17.4 / 2.7 hits | 19,572 dps · 1.9s / 244s · 13 / 1.4 hits | 19,886 dps · 2.4s / 246s · 13.4 / 1.5 hits | 20,201 dps · 2.1s / 246s · 15.3 / 1.8 hits | 20,515 dps · 2.7s / 340s · 10.6 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 9,479 dps · 3.5s / 389s · 26 / 3 hits | 9,642 dps · 3.2s / 426s · 18.9 / 2.6 hits | 9,804 dps · 3.3s / 466s · 18.8 / 3.1 hits | 9,967 dps · 3.6s / 471s · 15.3 / 2.4 hits | 10,130 dps · 3.7s / 472s · 11.4 / 1.2 hits | 10,293 dps · 4.6s / 475s · 11.8 / 1.3 hits | 10,456 dps · 4s / 476s · 13.4 / 1.6 hits | 10,618 dps · 5.3s / 658s · 9.3 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 15,442 dps · 2.2s / 239s · 32 / 3.7 hits | 15,707 dps · 2s / 262s · 23.3 / 3.2 hits | 15,972 dps · 2s / 286s · 23.1 / 3.9 hits | 16,238 dps · 2.2s / 289s · 18.8 / 2.9 hits | 16,503 dps · 2.3s / 290s · 14 / 1.5 hits | 16,768 dps · 2.8s / 291s · 14.5 / 1.6 hits | 17,033 dps · 2.5s / 292s · 16.6 / 1.9 hits | 17,299 dps · 3.2s / 404s · 11.4 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 9,091 dps · 3.7s / 406s · 26 / 3 hits | 9,266 dps · 3.4s / 444s · 18.9 / 2.6 hits | 9,423 dps · 3.4s / 485s · 18.8 / 3.1 hits | 9,579 dps · 3.8s / 490s · 15.3 / 2.4 hits | 9,735 dps · 3.8s / 491s · 11.4 / 1.2 hits | 9,892 dps · 4.8s / 494s · 11.8 / 1.3 hits | 10,048 dps · 4.2s / 495s · 13.4 / 1.6 hits | 10,205 dps · 5.5s / 684s · 9.3 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 9,092 dps · 3.7s / 406s · 29.6 / 3.4 hits | 9,248 dps · 3.4s / 444s · 21.6 / 3 hits | 9,404 dps · 3.4s / 486s · 21.4 / 3.6 hits | 9,560 dps · 3.8s / 491s · 17.4 / 2.7 hits | 9,717 dps · 3.8s / 492s · 13 / 1.4 hits | 9,873 dps · 4.8s / 495s · 13.4 / 1.5 hits | 10,029 dps · 4.2s / 496s · 15.3 / 1.8 hits | 10,185 dps · 5.5s / 686s · 10.6 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 7,692 dps · 4.3s / 480s · 26 / 3 hits | 7,826 dps · 4s / 525s · 18.9 / 2.6 hits | 7,960 dps · 4.1s / 574s · 18.8 / 3.1 hits | 8,097 dps · 4.5s / 579s · 15.3 / 2.4 hits | 8,231 dps · 4.5s / 581s · 11.4 / 1.2 hits | 8,365 dps · 5.7s / 584s · 11.8 / 1.3 hits | 8,503 dps · 5s / 585s · 13.4 / 1.6 hits | 8,641 dps · 6.5s / 808s · 9.3 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 5,172 dps · 6.4s / 714s · 26 / 3 hits | 5,270 dps · 5.9s / 780s · 18.9 / 2.6 hits | 5,369 dps · 6s / 852s · 18.8 / 3.1 hits | 5,478 dps · 6.6s / 856s · 15.3 / 2.4 hits | 5,577 dps · 6.7s / 857s · 11.4 / 1.2 hits | 5,677 dps · 8.3s / 861s · 11.8 / 1.3 hits | 5,787 dps · 7.3s / 860s · 13.4 / 1.6 hits | 5,898 dps · 9.5s / 1,184s · 9.3 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 7,222 + weapon 470 · Z2 Meteor, Void Rift, Arcane Beam; spells 7,345 + weapon 481 · Z3 Meteor, Void Rift, Arcane Beam; spells 7,468 + weapon 492 · Z4 Meteor, Void Rift, Arcane Beam; spells 7,590 + weapon 507 · Z5 Meteor, Void Rift, Arcane Beam; spells 7,713 + weapon 518 · Z6 Meteor, Void Rift, Arcane Beam; spells 7,836 + weapon 530 · Z7 Meteor, Void Rift, Arcane Beam; spells 7,959 + weapon 545 · Z8 Meteor, Void Rift, Arcane Beam; spells 8,081 + weapon 559
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,487 + weapon 2,684 · Z2 Sunray, Purify; spells 2,530 + weapon 2,740 · Z3 Sunray, Purify; spells 2,572 + weapon 2,797 · Z4 Sunray, Purify; spells 2,614 + weapon 2,864 · Z5 Sunray, Purify; spells 2,656 + weapon 2,921 · Z6 Sunray, Purify; spells 2,699 + weapon 2,978 · Z7 Sunray, Purify; spells 2,741 + weapon 3,046 · Z8 Sunray, Purify; spells 2,783 + weapon 3,115

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 406 | 202 | 714 | 3.5 |
| 2 | 444 | 221 | 780 | 3.5 |
| 3 | 485 | 241 | 852 | 3.5 |
| 4 | 490 | 244 | 856 | 3.5 |
| 5 | 491 | 244 | 857 | 3.5 |
| 6 | 494 | 246 | 861 | 3.5 |
| 7 | 495 | 246 | 860 | 3.5 |
| 8 | 684 | 340 | 1,184 | 3.5 |

### NG+10

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 25,863 dps · 2.2s / 236s · 12 / 1.4 hits | 26,177 dps · 2s / 259s · 8.7 / 1.2 hits | 26,492 dps · 2s / 285s · 8.6 / 1.4 hits | 26,806 dps · 2.2s / 289s · 7 / 1.1 hits | 27,121 dps · 2.3s / 291s · 5.1 / 0.5 hits ⚠1-shot | 27,435 dps · 2.8s / 294s · 5.3 / 0.6 hits ⚠1-shot | 27,750 dps · 2.5s / 296s · 6 / 0.7 hits ⚠1-shot | 28,064 dps · 3.3s / 411s · 4.1 / 0.3 hits ⚠1-shot |
| Slicey: twin daggers | 13,386 dps · 4.2s / 456s · 10.5 / 1.2 hits | 13,549 dps · 3.8s / 501s · 7.6 / 1 hits | 13,712 dps · 3.9s / 550s · 7.5 / 1.3 hits | 13,875 dps · 4.3s / 558s · 6.1 / 0.9 hits ⚠1-shot | 14,037 dps · 4.4s / 562s · 4.5 / 0.5 hits ⚠1-shot | 14,200 dps · 5.5s / 568s · 4.7 / 0.5 hits ⚠1-shot | 14,363 dps · 4.9s / 572s · 5.3 / 0.6 hits ⚠1-shot | 14,526 dps · 6.4s / 793s · 3.6 / 0.2 hits ⚠1-shot |
| Quality: longsword + shield | 21,807 dps · 2.6s / 280s · 13 / 1.5 hits | 22,073 dps · 2.3s / 307s · 9.4 / 1.3 hits | 22,338 dps · 2.4s / 338s · 9.3 / 1.6 hits | 22,603 dps · 2.6s / 343s · 7.5 / 1.2 hits | 22,868 dps · 2.7s / 345s · 5.6 / 0.6 hits ⚠1-shot | 23,134 dps · 3.4s / 349s · 5.7 / 0.7 hits ⚠1-shot | 23,399 dps · 3s / 351s · 6.5 / 0.8 hits ⚠1-shot | 23,664 dps · 3.9s / 487s · 4.5 / 0.3 hits ⚠1-shot |
| Bow (Slicey) | 12,865 dps · 4.4s / 474s · 10.5 / 1.2 hits | 13,021 dps · 4s / 521s · 7.6 / 1 hits | 13,178 dps · 4.1s / 573s · 7.5 / 1.3 hits | 13,334 dps · 4.5s / 581s · 6.1 / 0.9 hits ⚠1-shot | 13,491 dps · 4.6s / 585s · 4.5 / 0.5 hits ⚠1-shot | 13,647 dps · 5.7s / 591s · 4.7 / 0.5 hits ⚠1-shot | 13,804 dps · 5s / 595s · 5.3 / 0.6 hits ⚠1-shot | 13,960 dps · 6.6s / 826s · 3.6 / 0.2 hits ⚠1-shot |
| Crossbow (Bonk) | 12,840 dps · 4.4s / 475s · 12 / 1.4 hits | 12,996 dps · 4s / 522s · 8.7 / 1.2 hits | 13,152 dps · 4.1s / 574s · 8.6 / 1.4 hits | 13,308 dps · 4.5s / 582s · 7 / 1.1 hits | 13,464 dps · 4.6s / 586s · 5.1 / 0.5 hits ⚠1-shot | 13,621 dps · 5.7s / 592s · 5.3 / 0.6 hits ⚠1-shot | 13,777 dps · 5.1s / 596s · 6 / 0.7 hits ⚠1-shot | 13,933 dps · 6.6s / 827s · 4.1 / 0.3 hits ⚠1-shot |
| Brain caster: staff spells | 10,918 dps · 5.2s / 559s · 10.5 / 1.2 hits | 11,050 dps · 4.7s / 614s · 7.6 / 1 hits | 11,182 dps · 4.8s / 675s · 7.5 / 1.3 hits | 11,313 dps · 5.3s / 684s · 6.1 / 0.9 hits ⚠1-shot | 11,445 dps · 5.4s / 689s · 4.5 / 0.5 hits ⚠1-shot | 11,577 dps · 6.7s / 697s · 4.7 / 0.5 hits ⚠1-shot | 11,709 dps · 5.9s / 702s · 5.3 / 0.6 hits ⚠1-shot | 11,841 dps · 7.8s / 973s · 3.6 / 0.2 hits ⚠1-shot |
| Prayer caster: talisman spells | 7,558 dps · 7.5s / 807s · 10.5 / 1.2 hits | 7,650 dps · 6.7s / 887s · 7.6 / 1 hits | 7,741 dps · 6.9s / 975s · 7.5 / 1.3 hits | 7,833 dps · 7.6s / 988s · 6.1 / 0.9 hits ⚠1-shot | 7,925 dps · 7.8s / 995s · 4.5 / 0.5 hits ⚠1-shot | 8,016 dps · 9.7s / 1,006s · 4.7 / 0.5 hits ⚠1-shot | 8,108 dps · 8.6s / 1,013s · 5.3 / 0.6 hits ⚠1-shot | 8,199 dps · 11.3s / 1,406s · 3.6 / 0.2 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 10,167 + weapon 751 · Z2 Meteor, Void Rift, Arcane Beam; spells 10,290 + weapon 760 · Z3 Meteor, Void Rift, Arcane Beam; spells 10,413 + weapon 769 · Z4 Meteor, Void Rift, Arcane Beam; spells 10,535 + weapon 778 · Z5 Meteor, Void Rift, Arcane Beam; spells 10,658 + weapon 787 · Z6 Meteor, Void Rift, Arcane Beam; spells 10,781 + weapon 797 · Z7 Meteor, Void Rift, Arcane Beam; spells 10,904 + weapon 806 · Z8 Meteor, Void Rift, Arcane Beam; spells 11,026 + weapon 815
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 3,502 + weapon 4,057 · Z2 Sunray, Purify; spells 3,544 + weapon 4,106 · Z3 Sunray, Purify; spells 3,586 + weapon 4,155 · Z4 Sunray, Purify; spells 3,628 + weapon 4,205 · Z5 Sunray, Purify; spells 3,671 + weapon 4,254 · Z6 Sunray, Purify; spells 3,713 + weapon 4,303 · Z7 Sunray, Purify; spells 3,755 + weapon 4,353 · Z8 Sunray, Purify; spells 3,797 + weapon 4,402

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 474 | 236 | 807 | 3.4 |
| 2 | 521 | 259 | 887 | 3.4 |
| 3 | 573 | 285 | 975 | 3.4 |
| 4 | 581 | 289 | 988 | 3.4 |
| 5 | 585 | 291 | 995 | 3.4 |
| 6 | 591 | 294 | 1,006 | 3.4 |
| 7 | 595 | 296 | 1,013 | 3.4 |
| 8 | 826 | 411 | 1,406 | 3.4 |

## 3. Gems, compared

Each gem at the level a zone 5 drop has (first playthrough) and a +0% roll, on the quality build (longsword) at zone 5. Weapon gems are compared by how much they raise sustained light-attack DPS; armour gems by how much they raise effective HP against zone 5's room hits. Families that do neither are listed with their raw value.

Gem level 7 (zone 5 drop), +0% roll. Base: 165 DPS, 11.8 average hits to die.

| Gem | Kind | Baseline text | Effect on the build | Notes |
| --- | --- | --- | --- | --- |
| Quicksilver | weapon | +12% attack and cast speed | +2% sustained, +7% burst DPS |  |
| Tempo | weapon | −12% skill cooldowns | — |  |
| Fleetfoot | weapon | −0.6 s dodge recharge | — |  |
| Brutal | weapon | +11% damage | +6% sustained, +6% burst DPS |  |
| Ember | weapon | +13.2% of the hit as Fire, Burn buildup | +8% sustained, +8% burst DPS |  |
| Rime | weapon | +13.2% of the hit as Magic (frost), Chill buildup | +8% sustained, +8% burst DPS |  |
| Storm | weapon | +13.2% of the hit as Magic (lightning), Shock buildup | +8% sustained, +8% burst DPS |  |
| Dawn | weapon | +13.2% of the hit as Holy | +8% sustained, +8% burst DPS |  |
| Dusk | weapon | +13.2% of the hit as Void | +8% sustained, +8% burst DPS |  |
| Leech | weapon | 0.4% of max HP healed a hit (lifesteal) | — | heals 0.8% max HP per 10 s of attacking |
| Vigor | weapon | −16% stamina costs | +7% sustained, +0% burst DPS |  |
| Bulwark | armour | +16 defense to all types | +5% effective HP |  |
| Hearth | armour | +8% max HP | +5% effective HP |  |
| Zephyr | armour | +16% stamina regeneration | — |  |
| Gilt | armour | +11% Glowen found | — |  |

## 4. Weapons, weapon skills and spells

Every weapon at item level 5, rare, +0, held by a knight whose points (10 in each damage stat, plus 45 shared by the weapon's grades in proportion to their weight) suit that weapon. Best grip (one- or two-handed). Skills: listed damage multipliers × the weapon's power, per second of cooldown (single target; utility skills show 0).

| Weapon | Grades | Grip | Burst DPS | Sustained DPS | Per swing | Stamina/swing | Skills (dmg per s of cooldown) | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greathammer | S/- | 2H | 630 | 205 | 703 | 48.3 | Earthshaker 151, Meteor Lunge 122, Unstoppable 0 | ⚠ 1.39× median DPS; ⚠ skills 2.04× median |
| Greataxe | A/- | 2H | 569 | 176 | 516 | 41.4 | Cleave Spin 92, Execute 52, Bloodlust 0 |  |
| Colossal Sword | A/E | 2H | 585 | 192 | 601 | 43.1 | Guillotine 108, Stomp 40, Charged Swing 125 | ⚠ skills 2.04× median |
| Crossbow | B/- | 2H | 450 | 147 | 444 | 41.4 | Piercing Bolt 79, Explosive Bolt 48, Rapid Fire 88 |  |
| Club | E/- | 2H | 420 | 148 | 342 | 31.1 | Bonk 79, Wild Swing 38, Tantrum 0 |  |
| Twin Daggers | -/S | 2H | 421 | 144 | 144 | 13.8 | Shadow Step 77, Fan of Knives 20, Flurry 86 |  |
| Rapier | -/A | 1H | 353 | 118 | 163 | 19 | Lunge 51, Riposte Stance 0, Thousand Cuts 55 |  |
| Katana | D/A | 2H | 387 | 135 | 204 | 20.7 | Iai Slash 53, Crescent 32, Blood Moon 0 |  |
| Bow | -/B | 2H | 299 | 110 | 287 | 34.5 | Volley 79, Piercing Shot 40, Rain 15 |  |
| Whip | -/E | 1H | 287 | 114 | 187 | 20.7 | Lash 53, Crack 28, Serpent Coil 55 |  |
| Longsword | B/B | 2H | 437 | 151 | 285 | 25.9 | Shield Breaker 59, Spin Slash 33, Battle Cry 0 |  |
| Spear | C/B | 2H | 353 | 121 | 213 | 24.2 | Impale 59, Sweep 28, Phalanx 0 |  |
| Battleaxe | A/D | 2H | 559 | 190 | 431 | 31.1 | Cleave 83, Hook 37, Frenzy 0 |  |
| Mace | B/E | 2H | 493 | 170 | 389 | 31.1 | Holy Smite 74, Consecrate 40, Judgment 27 |  |
| Halberd | A/C | 2H | 460 | 159 | 346 | 29.3 | Moulinet 102, Hook Pull 35, Vault 44 |  |
| Twin Axes | C/B | 2H | 504 | 172 | 258 | 20.7 | Whirlwind 106, Throw 48, Rampage 0 |  |
| Hollow Maul | B/-/Br B | 2H | 372 | 127 | 391 | 41.4 | Singularity 57, Event Horizon 86, Null Shell 0 |  |
| Spellblade | -/B/Br B | 1H | 352 | 125 | 226 | 24.2 | Arc Wave 40, Blink Strike 36, Runic Edge 0 |  |
| Censer Flail | B/-/Pr B | 2H | 453 | 155 | 351 | 31.1 | Incense 61, Brimstone 52, Sanctified Flame 0 |  |
| Dawn Glaive | -/B/Pr B | 1H | 364 | 126 | 260 | 27.6 | Sunrise 54, Halo Throw 32, Judgement Ray 36 |  |
| Chakrams | E/B | 2H | 317 | 104 | 178 | 24.2 | Orbit 52, Ring Storm 10, Grand Ring 18 |  |

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
| First playthrough | 1 | L6 | 33 | 90 | 2.7 | 293 | 22 | 13.1 | 1 | 1 |  |
| First playthrough | 2 | L15 | 51 | 122 | 2.4 | 345 | 22 | 15.5 | 0.88 | 1.18 |  |
| First playthrough | 3 | L26 | 77 | 166 | 2.2 | 398 | 33 | 12.2 | 0.8 | 0.93 |  |
| First playthrough | 4 | L37 | 116 | 217 | 1.9 | 450 | 36 | 12.6 | 0.69 | 0.96 |  |
| First playthrough | 5 | L47 | 165 | 253 | 1.5 | 503 | 43 | 11.8 | 0.57 | 0.9 |  |
| First playthrough | 6 | L57 | 240 | 354 | 1.5 | 555 | 49 | 11.2 | 0.54 | 0.86 |  |
| First playthrough | 7 | L67 | 288 | 351 | 1.2 | 608 | 48 | 12.6 | 0.45 | 0.96 |  |
| First playthrough | 8 | L76 | 335 | 521 | 1.6 | 645 | 52 | 12.3 | 0.57 | 0.94 |  |
| NG+1 | 1 | L84 | 424 | 1,949 | 4.6 | 665 | 45 | 14.8 | 1.69 | 1.13 |  |
| NG+1 | 2 | L90 | 520 | 1,762 | 3.4 | 685 | 62 | 11 | 1.25 | 0.84 |  |
| NG+1 | 3 | L96 | 632 | 1,760 | 2.8 | 705 | 60 | 11.7 | 1.02 | 0.89 |  |
| NG+1 | 4 | L102 | 698 | 1,983 | 2.8 | 725 | 60 | 12.1 | 1.05 | 0.92 |  |
| NG+1 | 5 | L108 | 765 | 2,065 | 2.7 | 745 | 69 | 10.9 | 0.99 | 0.83 |  |
| NG+1 | 6 | L115 | 839 | 2,753 | 3.3 | 765 | 73 | 10.4 | 1.21 | 0.8 |  |
| NG+1 | 7 | L122 | 913 | 2,464 | 2.7 | 785 | 61 | 12.9 | 0.99 | 0.98 |  |
| NG+1 | 8 | L130 | 995 | 3,481 | 3.5 | 805 | 86 | 9.4 | 1.29 | 0.72 |  |
| NG+2 | 1 | L137 | 1,167 | 5,585 | 4.8 | 825 | 56 | 14.7 | 1.76 | 1.12 |  |
| NG+2 | 2 | L143 | 1,342 | 5,281 | 3.9 | 854 | 79 | 10.9 | 1.45 | 0.83 |  |
| NG+2 | 3 | L150 | 1,537 | 5,963 | 3.9 | 883 | 81 | 10.9 | 1.43 | 0.83 |  |
| NG+2 | 4 | L156 | 1,636 | 6,935 | 4.2 | 912 | 85 | 10.8 | 1.56 | 0.82 |  |
| NG+2 | 5 | L163 | 1,770 | 7,566 | 4.3 | 941 | 104 | 9.1 | 1.57 | 0.69 |  |
| NG+2 | 6 | L170 | 1,922 | 10,091 | 5.2 | 970 | 115 | 8.4 | 1.93 | 0.64 |  |
| NG+2 | 7 | L178 | 2,081 | 9,429 | 4.5 | 1,014 | 98 | 10.3 | 1.67 | 0.79 |  |
| NG+2 | 8 | L186 | 2,269 | 12,920 | 5.7 | 1,043 | 146 | 7.2 | 2.1 | 0.55 | ⚠ kills 2.1× slower |
| NG+3 | 1 | L193 | 2,614 | 12,318 | 4.7 | 1,072 | 61 | 17.5 | 1.73 | 1.33 |  |
| NG+3 | 2 | L201 | 2,992 | 10,968 | 3.7 | 1,115 | 90 | 12.4 | 1.35 | 0.95 |  |
| NG+3 | 3 | L208 | 3,407 | 11,551 | 3.4 | 1,144 | 97 | 11.8 | 1.25 | 0.9 |  |
| NG+3 | 4 | L215 | 3,662 | 12,652 | 3.5 | 1,173 | 102 | 11.5 | 1.27 | 0.88 |  |
| NG+3 | 5 | L222 | 3,907 | 13,389 | 3.4 | 1,202 | 128 | 9.4 | 1.26 | 0.72 |  |
| NG+3 | 6 | L230 | 4,215 | 16,840 | 4 | 1,231 | 146 | 8.4 | 1.47 | 0.64 |  |
| NG+3 | 7 | L239 | 4,515 | 15,193 | 3.4 | 1,275 | 130 | 9.8 | 1.24 | 0.75 |  |
| NG+3 | 8 | L247 | 4,826 | 20,132 | 4.2 | 1,304 | 199 | 6.6 | 1.54 | 0.5 |  |
| NG+4 | 1 | L255 | 5,434 | 19,317 | 3.6 | 1,347 | 70 | 19.3 | 1.31 | 1.47 |  |
| NG+4 | 2 | L263 | 6,082 | 17,287 | 2.8 | 1,376 | 104 | 13.3 | 1.05 | 1.01 |  |
| NG+4 | 3 | L270 | 6,760 | 17,759 | 2.6 | 1,405 | 113 | 12.4 | 0.97 | 0.94 |  |
| NG+4 | 4 | L278 | 7,129 | 20,038 | 2.8 | 1,449 | 120 | 12 | 1.03 | 0.92 |  |
| NG+4 | 5 | L285 | 7,538 | 20,678 | 2.7 | 1,478 | 153 | 9.7 | 1.01 | 0.74 |  |
| NG+4 | 6 | L293 | 7,981 | 26,699 | 3.3 | 1,507 | 173 | 8.7 | 1.23 | 0.67 |  |
| NG+4 | 7 | L302 | 8,438 | 23,519 | 2.8 | 1,536 | 152 | 10.1 | 1.03 | 0.77 |  |
| NG+4 | 8 | L312 | 8,963 | 31,917 | 3.6 | 1,536 | 230 | 6.7 | 1.31 | 0.51 |  |
| NG+5 | 1 | L321 | 9,451 | 23,380 | 2.5 | 1,536 | 69 | 22.3 | 0.91 | 1.7 |  |
| NG+5 | 2 | L329 | 9,984 | 21,758 | 2.2 | 1,536 | 105 | 14.6 | 0.8 | 1.11 |  |
| NG+5 | 3 | L337 | 10,502 | 22,616 | 2.2 | 1,536 | 118 | 13 | 0.79 | 0.99 |  |
| NG+5 | 4 | L345 | 11,006 | 25,399 | 2.3 | 1,536 | 122 | 12.6 | 0.85 | 0.96 |  |
| NG+5 | 5 | L352 | 11,492 | 26,210 | 2.3 | 1,536 | 153 | 10.1 | 0.84 | 0.77 |  |
| NG+5 | 6 | L361 | 11,989 | 32,869 | 2.7 | 1,536 | 170 | 9.1 | 1.01 | 0.69 |  |
| NG+5 | 7 | L371 | 12,333 | 29,709 | 2.4 | 1,536 | 146 | 10.5 | 0.89 | 0.8 |  |
| NG+5 | 8 | L381 | 12,619 | 39,949 | 3.2 | 1,536 | 224 | 6.9 | 1.17 | 0.52 |  |
| NG+6 | 1 | L390 | 13,020 | 27,962 | 2.1 | 1,536 | 66 | 23.3 | 0.79 | 1.78 |  |
| NG+6 | 2 | L399 | 13,341 | 26,927 | 2 | 1,536 | 101 | 15.1 | 0.74 | 1.15 |  |
| NG+6 | 3 | L408 | 13,665 | 27,119 | 2 | 1,536 | 114 | 13.5 | 0.73 | 1.03 |  |
| NG+6 | 4 | L416 | 13,990 | 31,234 | 2.2 | 1,536 | 118 | 13 | 0.82 | 0.99 |  |
| NG+6 | 5 | L425 | 14,253 | 31,394 | 2.2 | 1,536 | 149 | 10.3 | 0.81 | 0.79 |  |
| NG+6 | 6 | L434 | 14,614 | 39,993 | 2.7 | 1,536 | 166 | 9.3 | 1.01 | 0.71 |  |
| NG+6 | 7 | L445 | 14,912 | 35,545 | 2.4 | 1,536 | 143 | 10.7 | 0.88 | 0.82 |  |
| NG+6 | 8 | L455 | 15,177 | 48,413 | 3.2 | 1,536 | 220 | 7 | 1.17 | 0.53 |  |
| NG+7 | 1 | L466 | 15,442 | 33,261 | 2.2 | 1,536 | 62 | 24.7 | 0.79 | 1.88 |  |
| NG+7 | 2 | L476 | 15,707 | 31,208 | 2 | 1,536 | 96 | 16 | 0.73 | 1.22 |  |
| NG+7 | 3 | L485 | 15,972 | 32,369 | 2 | 1,536 | 108 | 14.2 | 0.75 | 1.09 |  |
| NG+7 | 4 | L493 | 16,238 | 36,200 | 2.2 | 1,536 | 112 | 13.7 | 0.82 | 1.04 |  |
| NG+7 | 5 | L502 | 16,503 | 37,356 | 2.3 | 1,536 | 142 | 10.8 | 0.83 | 0.83 |  |
| NG+7 | 6 | L511 | 16,768 | 47,345 | 2.8 | 1,536 | 158 | 9.7 | 1.04 | 0.74 |  |
| NG+7 | 7 | L522 | 17,033 | 42,209 | 2.5 | 1,536 | 137 | 11.2 | 0.91 | 0.86 |  |
| NG+7 | 8 | L533 | 17,299 | 56,110 | 3.2 | 1,536 | 211 | 7.3 | 1.19 | 0.56 |  |
| NG+10 | 1 | L717 | 21,807 | 56,365 | 2.6 | 1,536 | 154 | 10 | 0.95 | 0.76 |  |
| NG+10 | 2 | L728 | 22,073 | 51,511 | 2.3 | 1,536 | 238 | 6.5 | 0.86 | 0.49 | ⚠ survives 2× fewer hits |
| NG+10 | 3 | L739 | 22,338 | 53,428 | 2.4 | 1,536 | 269 | 5.7 | 0.88 | 0.44 | ⚠ survives 2.3× fewer hits |
| NG+10 | 4 | L749 | 22,603 | 59,750 | 2.6 | 1,536 | 282 | 5.5 | 0.97 | 0.42 | ⚠ survives 2.4× fewer hits |
| NG+10 | 5 | L760 | 22,868 | 61,658 | 2.7 | 1,536 | 357 | 4.3 | 0.99 | 0.33 | ⚠ survives 3× fewer hits |
| NG+10 | 6 | L772 | 23,134 | 78,146 | 3.4 | 1,536 | 400 | 3.8 | 1.24 | 0.29 | ⚠ survives 3.4× fewer hits |
| NG+10 | 7 | L785 | 23,399 | 69,669 | 3 | 1,536 | 347 | 4.4 | 1.1 | 0.34 | ⚠ survives 3× fewer hits |
| NG+10 | 8 | L798 | 23,664 | 92,613 | 3.9 | 1,536 | 540 | 2.8 | 1.44 | 0.22 | ⚠ survives 4.6× fewer hits |

