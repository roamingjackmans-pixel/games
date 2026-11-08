# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 3,652 void) kills the Bonk: greathammer (2H) build (980 HP) in one hit (0.98). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
2. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 3,652 void) kills the Slicey: twin daggers build (819 HP) in one hit (0.82). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
3. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 3,652 void) kills the Bow (Slicey) build (808 HP) in one hit (0.81). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
4. **Boss length** (severity 5.8): NG+10 zone 8: the median build needs 826 s of nonstop hitting to kill The Landlord (11,525,707 HP), 13.8 minutes before any dodging (target 11 min, D301). *Suggested:* Trim its NG_BOSS_HP factor (D301), the boss HP multiplier for this cycle, or the extra phase bars.
5. **Build spread** (severity 4.8): NG+4 zone 2: the slowest build (Prayer caster: talisman spells) takes 804 s on the boss, 3.6× the fastest (Bonk: greathammer (2H), 223 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
6. **Build spread** (severity 4.8): NG+4 zone 3: the slowest build (Prayer caster: talisman spells) takes 819 s on the boss, 3.6× the fastest (Bonk: greathammer (2H), 227 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
7. **Build spread** (severity 4.8): NG+4 zone 1: the slowest build (Prayer caster: talisman spells) takes 787 s on the boss, 3.6× the fastest (Bonk: greathammer (2H), 218 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
8. **Gems** (severity 4.7): Quicksilver raises sustained DPS by +3% (burst +7%) where Brutal gives +6% (0.39× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
9. **Weapon skills** (severity 4.3): Colossal Sword's skills deal 273 damage per second of cooldown, 2.24× the median weapon's (122). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
10. **Weapon skills** (severity 4.3): Greathammer's skills deal 273 damage per second of cooldown, 2.24× the median weapon's (122). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
11. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
12. **Weapons** (severity 3.8): Greathammer: 223 sustained light-attack DPS, 1.52× the median weapon (147) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
13. **Enemy curve** (severity 3.8): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 108. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
14. **Spells** (severity 3.5): Arcane Beam (brain): 16.4 damage per busy second at Spell Skill 100, 2.05× the brain median (8). *Suggested:* Lengthen its cooldown or lower its base.
15. **Enemy curve** (severity 3.2): NG+10: zone 7 room enemies have 69,669 HP on average, below zone 6's 78,146. *Suggested:* Check the zone roster mix and the HP curve.
16. **Enemy curve** (severity 3.2): NG+3: zone 7 room enemies have 16,355 HP on average, below zone 6's 18,345. *Suggested:* Check the zone roster mix and the HP curve.
17. **Enemy curve** (severity 3.2): NG+7: zone 7 room enemies have 42,209 HP on average, below zone 6's 47,345. *Suggested:* Check the zone roster mix and the HP curve.
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
| 1 | 1,987 | 398–3,983 | 131 | 41–243 |  |
| 2 | 1,900 | 433–4,330 | 230 | 43–560 | ⚠ HP below zone 1 |
| 3 | 2,044 | 466–4,657 | 239 | 45–748 |  |
| 4 | 2,381 | 502–6,280 | 269 | 51–765 |  |
| 5 | 2,581 | 546–5,914 | 287 | 71–607 |  |
| 6 | 3,420 | 591–8,271 | 311 | 52–778 |  |
| 7 | 3,221 | 643–8,035 | 342 | 96–1,011 | ⚠ HP below zone 6 |
| 8 | 4,429 | 687–10,300 | 380 | 73–1,465 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 185 (1,549) | 407 (1,684) | 323 (1,811) | 416 (1,954) | 391 (2,123) | 424 (2,297) | 496 (2,500) | 366 (2,670) |
| brute | 196 (3,983) | 431 (4,330) | 536 (4,657) | 616 (5,024) | 456 (5,459) | 677 (8,271) | 833 (6,428) | 907 (10,300) |
| caster | 139 (1,217) | 190 (1,323) | 190 (1,423) | 269 (1,535) | 210 (1,668) | 250 (1,805) | 293 (1,964) | 230 (2,098) |
| fodder | 110 (1,328) | 184 (1,588) | 147 (1,397) | 196 (1,675) | 223 (2,002) | 224 (2,363) | 263 (2,571) | 283 (2,976) |
| hazard | 107 (1,770) | 172 (1,925) | 262 (2,691) | 170 (2,233) | 254 (2,911) | 303 (2,626) | 266 (2,857) | 419 (6,104) |
| ranged | 91 (1,106) | 151 (1,203) | 224 (1,294) | 202 (1,396) | 210 (1,516) | 195 (1,641) | 266 (2,678) | 235 (1,907) |
| support | 84 (1,217) | 166 (1,323) | — | 199 (1,535) | 400 (1,668) | 208 (1,805) | 219 (1,964) | 302 (2,098) |
| swarm | 41 (398) | 65 (433) | 52 (466) | 72 (502) | 79 (546) | 61 (591) | 110 (643) | 105 (687) |
| tank | 165 (3,319) | 350 (3,608) | 316 (3,881) | 350 (6,280) | 421 (5,914) | 386 (6,400) | 415 (8,035) | 476 (7,725) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 30,272 / 45,408 / 45,408 | 121,087 | 526 / 578 / 663 | 1,033 |  |
| 2 | Mother Spore | 3 | 40,703 / 61,055 / 61,055 | 162,813 | 413 / 627 / 769 | 1,219 |  |
| 3 | The Bloatking | 3 | 50,293 / 75,440 / 75,440 | 201,173 | 505 / 651 / 793 | 1,032 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 58,644 / 87,966 / 87,966 | 234,575 | 618 / 866 / 1,031 | 1,437 |  |
| 5 | Foreman Ignatius | 3 | 102,192 / 85,161 / 85,161 | 272,514 | 707 / 1,024 / 1,193 | 2,081 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 39,348 / 137,717 / 137,717 | 314,782 | 699 / 1,061 / 1,161 | 1,964 |  |
| 7 | Archmagister Tock | 3 | 109,916 / 128,235 / 128,235 | 366,386 | 1,063 / 1,609 / 1,907 | 2,426 |  |
| 8 | The Landlord | 4 | 156,423 / 151,822 / 151,821 / 182,187 | 642,253 | 1,287 / 1,639 / 2,416 / 2,048 | 3,652 |  |

### NG+2

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 6,853 | 1,374–13,736 | 411 | 127–763 |  |
| 2 | 6,456 | 1,471–14,711 | 727 | 136–1,771 | ⚠ HP below zone 1 |
| 3 | 6,838 | 1,558–15,581 | 769 | 144–2,408 |  |
| 4 | 7,872 | 1,661–20,763 | 864 | 164–2,461 |  |
| 5 | 8,388 | 1,774–19,221 | 939 | 231–1,987 |  |
| 6 | 10,968 | 1,895–26,525 | 1,007 | 168–2,516 |  |
| 7 | 10,117 | 2,019–25,237 | 1,112 | 311–3,280 | ⚠ HP below zone 6 |
| 8 | 13,892 | 2,154–32,308 | 1,205 | 232–4,645 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 579 (5,342) | 1,287 (5,721) | 1,039 (6,059) | 1,340 (6,460) | 1,281 (6,900) | 1,370 (7,368) | 1,611 (7,851) | 1,161 (8,376) |
| brute | 615 (13,736) | 1,362 (14,711) | 1,725 (15,581) | 1,983 (16,611) | 1,493 (17,743) | 2,190 (26,525) | 2,704 (20,189) | 2,876 (32,308) |
| caster | 437 (4,197) | 599 (4,495) | 612 (4,761) | 865 (5,075) | 689 (5,421) | 807 (5,789) | 949 (6,169) | 730 (6,581) |
| fodder | 343 (4,579) | 582 (5,394) | 474 (4,674) | 631 (5,537) | 731 (6,506) | 723 (7,579) | 854 (8,076) | 896 (9,333) |
| hazard | 334 (6,105) | 545 (6,538) | 843 (9,002) | 547 (7,382) | 831 (9,463) | 979 (8,421) | 863 (8,973) | 1,327 (19,145) |
| ranged | 286 (3,816) | 477 (4,086) | 722 (4,328) | 650 (4,614) | 686 (4,929) | 629 (5,263) | 863 (8,412) | 747 (5,983) |
| support | 262 (4,197) | 524 (4,495) | — | 639 (5,075) | 1,311 (5,421) | 673 (5,789) | 712 (6,169) | 958 (6,581) |
| swarm | 127 (1,374) | 204 (1,471) | 169 (1,558) | 232 (1,661) | 260 (1,774) | 196 (1,895) | 357 (2,019) | 332 (2,154) |
| tank | 517 (11,447) | 1,107 (12,259) | 1,017 (12,984) | 1,126 (20,763) | 1,377 (19,221) | 1,250 (20,526) | 1,346 (25,237) | 1,510 (24,231) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 185,436 / 278,155 / 278,155 | 741,746 | 1,649 / 1,810 / 2,079 | 3,239 |  |
| 2 | Mother Spore | 3 | 212,573 / 318,860 / 318,860 | 850,294 | 1,308 / 1,984 / 2,434 | 3,855 |  |
| 3 | The Bloatking | 3 | 241,508 / 362,262 / 362,262 | 966,031 | 1,626 / 2,095 / 2,552 | 3,324 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 255,013 / 382,519 / 382,519 | 1,020,051 | 1,989 / 2,787 / 3,316 | 4,624 |  |
| 5 | Foreman Ignatius | 3 | 402,407 / 335,340 / 335,340 | 1,073,088 | 2,313 / 3,352 / 3,907 | 6,815 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 141,513 / 495,297 / 495,297 | 1,132,106 | 2,260 / 3,432 / 3,754 | 6,354 |  |
| 7 | Archmagister Tock | 3 | 357,959 / 417,619 / 417,619 | 1,193,198 | 3,449 / 5,221 / 6,187 | 7,875 |  |
| 8 | The Landlord | 4 | 421,077 / 408,692 / 408,691 / 490,431 | 1,728,891 | 4,083 / 5,196 / 7,661 / 6,493 | 11,580 |  |

### NG+3

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 13,389 | 2,684–26,838 | 811 | 251–1,503 |  |
| 2 | 12,160 | 2,771–27,705 | 1,399 | 262–3,407 | ⚠ HP below zone 1 |
| 3 | 12,542 | 2,858–28,577 | 1,439 | 270–4,505 |  |
| 4 | 14,026 | 2,960–36,998 | 1,578 | 300–4,495 |  |
| 5 | 14,474 | 3,062–33,166 | 1,676 | 413–3,545 |  |
| 6 | 18,345 | 3,169–44,365 | 1,758 | 293–4,395 |  |
| 7 | 16,355 | 3,264–40,796 | 1,893 | 529–5,585 | ⚠ HP below zone 6 |
| 8 | 21,741 | 3,371–50,560 | 2,017 | 389–7,779 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 1,140 (10,437) | 2,477 (10,774) | 1,945 (11,113) | 2,447 (11,510) | 2,286 (11,906) | 2,393 (12,324) | 2,743 (12,692) | 1,945 (13,108) |
| brute | 1,211 (26,838) | 2,621 (27,705) | 3,228 (28,577) | 3,621 (29,598) | 2,664 (30,615) | 3,825 (44,365) | 4,605 (32,637) | 4,815 (50,560) |
| caster | 861 (8,200) | 1,153 (8,466) | 1,146 (8,732) | 1,579 (9,044) | 1,229 (9,355) | 1,410 (9,683) | 1,617 (9,972) | 1,222 (10,299) |
| fodder | 676 (8,946) | 1,120 (10,159) | 887 (8,573) | 1,152 (9,866) | 1,305 (11,226) | 1,263 (12,676) | 1,455 (13,055) | 1,500 (14,606) |
| hazard | 658 (11,928) | 1,048 (12,313) | 1,577 (16,511) | 999 (13,155) | 1,482 (16,328) | 1,709 (14,084) | 1,470 (14,505) | 2,222 (29,962) |
| ranged | 564 (7,455) | 917 (7,696) | 1,351 (7,938) | 1,186 (8,222) | 1,225 (8,504) | 1,099 (8,803) | 1,470 (13,599) | 1,250 (9,363) |
| support | 517 (8,200) | 1,009 (8,466) | — | 1,167 (9,044) | 2,340 (9,355) | 1,175 (9,683) | 1,213 (9,972) | 1,604 (10,299) |
| swarm | 251 (2,684) | 393 (2,771) | 315 (2,858) | 424 (2,960) | 464 (3,062) | 342 (3,169) | 607 (3,264) | 556 (3,371) |
| tank | 1,018 (22,365) | 2,129 (23,088) | 1,903 (23,814) | 2,056 (36,998) | 2,458 (33,166) | 2,182 (34,330) | 2,293 (40,796) | 2,528 (37,920) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 362,310 / 543,465 / 543,465 | 1,449,241 | 3,248 / 3,567 / 4,096 | 6,381 |  |
| 2 | Mother Spore | 3 | 400,342 / 600,512 / 600,512 | 1,601,366 | 2,515 / 3,816 / 4,682 | 7,417 |  |
| 3 | The Bloatking | 3 | 442,942 / 664,413 / 664,413 | 1,771,767 | 3,042 / 3,921 / 4,775 | 6,219 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 454,404 / 681,607 / 681,607 | 1,817,617 | 3,633 / 5,089 / 6,056 | 8,444 |  |
| 5 | Foreman Ignatius | 3 | 694,349 / 578,625 / 578,625 | 1,851,600 | 4,128 / 5,982 / 6,972 | 12,161 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 236,687 / 828,406 / 828,406 | 1,893,499 | 3,947 / 5,994 / 6,556 | 11,095 |  |
| 7 | Archmagister Tock | 3 | 578,648 / 675,089 / 675,089 | 1,928,826 | 5,873 / 8,891 / 10,536 | 13,409 |  |
| 8 | The Landlord | 4 | 658,966 / 639,585 / 639,584 / 767,502 | 2,705,636 | 6,837 / 8,701 / 12,828 / 10,872 | 19,391 |  |

### NG+4

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 21,065 | 4,222–42,225 | 1,132 | 350–2,099 |  |
| 2 | 19,165 | 4,367–43,668 | 1,953 | 366–4,757 | ⚠ HP below zone 1 |
| 3 | 19,799 | 4,511–45,111 | 2,009 | 377–6,290 |  |
| 4 | 22,141 | 4,672–58,403 | 2,204 | 418–6,275 |  |
| 5 | 22,848 | 4,833–52,355 | 2,340 | 576–4,950 |  |
| 6 | 28,958 | 5,002–70,033 | 2,454 | 409–6,136 |  |
| 7 | 25,817 | 5,152–64,399 | 2,643 | 739–7,798 | ⚠ HP below zone 6 |
| 8 | 34,319 | 5,321–79,813 | 2,816 | 543–10,861 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 1,591 (16,421) | 3,458 (16,982) | 2,715 (17,543) | 3,417 (18,170) | 3,192 (18,794) | 3,341 (19,454) | 3,831 (20,035) | 2,715 (20,692) |
| brute | 1,691 (42,225) | 3,659 (43,668) | 4,508 (45,111) | 5,055 (46,723) | 3,720 (48,328) | 5,340 (70,033) | 6,430 (51,519) | 6,723 (79,813) |
| caster | 1,202 (12,902) | 1,610 (13,343) | 1,600 (13,784) | 2,205 (14,276) | 1,716 (14,767) | 1,969 (15,285) | 2,257 (15,742) | 1,707 (16,258) |
| fodder | 944 (14,075) | 1,564 (16,012) | 1,238 (13,533) | 1,608 (15,574) | 1,822 (17,720) | 1,764 (20,010) | 2,032 (20,608) | 2,095 (23,057) |
| hazard | 918 (18,767) | 1,464 (19,408) | 2,201 (26,064) | 1,395 (20,766) | 2,070 (25,775) | 2,386 (22,233) | 2,052 (22,897) | 3,103 (47,296) |
| ranged | 787 (11,729) | 1,281 (12,130) | 1,887 (12,531) | 1,656 (12,979) | 1,710 (13,424) | 1,534 (13,896) | 2,052 (21,466) | 1,745 (14,780) |
| support | 721 (12,902) | 1,409 (13,343) | — | 1,630 (14,276) | 3,267 (14,767) | 1,640 (15,285) | 1,693 (15,742) | 2,240 (16,258) |
| swarm | 350 (4,222) | 549 (4,367) | 440 (4,511) | 593 (4,672) | 648 (4,833) | 477 (5,002) | 848 (5,152) | 776 (5,321) |
| tank | 1,421 (35,187) | 2,973 (36,390) | 2,657 (37,592) | 2,870 (58,403) | 3,432 (52,355) | 3,047 (54,192) | 3,201 (64,399) | 3,530 (59,859) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 570,035 / 855,052 / 855,052 | 2,280,139 | 4,535 / 4,980 / 5,719 | 8,909 |  |
| 2 | Mother Spore | 3 | 631,005 / 946,508 / 946,508 | 2,524,021 | 3,512 / 5,328 / 6,537 | 10,356 |  |
| 3 | The Bloatking | 3 | 699,215 / 1,048,823 / 1,048,823 | 2,796,861 | 4,247 / 5,474 / 6,667 | 8,683 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 717,310 / 1,075,965 / 1,075,965 | 2,869,239 | 5,072 / 7,105 / 8,455 | 11,790 |  |
| 5 | Foreman Ignatius | 3 | 1,096,080 / 913,401 / 913,401 | 2,922,883 | 5,764 / 8,352 / 9,735 | 16,979 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 373,628 / 1,307,698 / 1,307,698 | 2,989,024 | 5,511 / 8,368 / 9,154 | 15,492 |  |
| 7 | Archmagister Tock | 3 | 913,437 / 1,065,676 / 1,065,676 | 3,044,790 | 8,201 / 12,414 / 14,711 | 18,723 |  |
| 8 | The Landlord | 4 | 1,040,225 / 1,009,630 / 1,009,629 / 1,211,556 | 4,271,040 | 9,546 / 12,149 / 17,911 / 15,180 | 27,075 |  |

### NG+5

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 25,221 | 5,055–50,554 | 1,301 | 402–2,413 |  |
| 2 | 23,049 | 5,252–52,517 | 2,246 | 421–5,471 | ⚠ HP below zone 1 |
| 3 | 23,907 | 5,447–54,471 | 2,310 | 434–7,233 |  |
| 4 | 26,736 | 5,642–70,522 | 2,534 | 481–7,217 |  |
| 5 | 27,590 | 5,836–63,219 | 2,691 | 662–5,692 |  |
| 6 | 34,967 | 6,040–84,565 | 2,823 | 470–7,056 |  |
| 7 | 31,174 | 6,221–77,762 | 3,039 | 850–8,967 | ⚠ HP below zone 6 |
| 8 | 41,441 | 6,425–96,374 | 3,239 | 624–12,490 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 1,830 (19,660) | 3,977 (20,423) | 3,122 (21,183) | 3,929 (21,940) | 3,670 (22,694) | 3,842 (23,490) | 4,405 (24,193) | 3,122 (24,986) |
| brute | 1,944 (50,554) | 4,208 (52,517) | 5,184 (54,471) | 5,813 (56,418) | 4,278 (58,356) | 6,141 (84,565) | 7,394 (62,210) | 7,732 (96,374) |
| caster | 1,383 (15,447) | 1,852 (16,047) | 1,840 (16,644) | 2,536 (17,239) | 1,973 (17,831) | 2,264 (18,457) | 2,596 (19,008) | 1,963 (19,632) |
| fodder | 1,086 (16,851) | 1,799 (19,256) | 1,424 (16,341) | 1,849 (18,806) | 2,096 (21,397) | 2,029 (24,162) | 2,336 (24,884) | 2,409 (27,841) |
| hazard | 1,056 (22,469) | 1,683 (23,341) | 2,532 (31,472) | 1,604 (25,074) | 2,380 (31,123) | 2,744 (26,846) | 2,360 (27,649) | 3,569 (57,110) |
| ranged | 905 (14,043) | 1,473 (14,588) | 2,170 (15,131) | 1,904 (15,672) | 1,966 (16,210) | 1,764 (16,779) | 2,360 (25,921) | 2,007 (17,847) |
| support | 830 (15,447) | 1,620 (16,047) | — | 1,874 (17,239) | 3,757 (17,831) | 1,887 (18,457) | 1,947 (19,008) | 2,576 (19,632) |
| swarm | 402 (5,055) | 631 (5,252) | 506 (5,447) | 682 (5,642) | 745 (5,836) | 549 (6,040) | 975 (6,221) | 892 (6,425) |
| tank | 1,634 (42,129) | 3,419 (43,764) | 3,056 (45,393) | 3,301 (70,522) | 3,946 (63,219) | 3,504 (65,437) | 3,681 (77,762) | 4,059 (72,280) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 682,484 / 1,023,726 / 1,023,726 | 2,729,935 | 5,215 / 5,727 / 6,577 | 10,245 |  |
| 2 | Mother Spore | 3 | 758,866 / 1,138,300 / 1,138,300 | 3,035,465 | 4,039 / 6,127 / 7,518 | 11,909 |  |
| 3 | The Bloatking | 3 | 844,302 / 1,266,454 / 1,266,454 | 3,377,210 | 4,884 / 6,295 / 7,668 | 9,986 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 866,152 / 1,299,227 / 1,299,227 | 3,464,606 | 5,833 / 8,170 / 9,723 | 13,559 |  |
| 5 | Foreman Ignatius | 3 | 1,323,517 / 1,102,932 / 1,102,932 | 3,529,381 | 6,629 / 9,605 / 11,195 | 19,526 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 451,156 / 1,579,045 / 1,579,045 | 3,609,246 | 6,337 / 9,624 / 10,527 | 17,815 |  |
| 7 | Archmagister Tock | 3 | 1,102,975 / 1,286,804 / 1,286,804 | 3,676,583 | 9,431 / 14,276 / 16,917 | 21,531 |  |
| 8 | The Landlord | 4 | 1,256,072 / 1,219,128 / 1,219,127 / 1,462,954 | 5,157,281 | 10,977 / 13,971 / 20,598 / 17,458 | 31,136 |  |

### NG+6

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 29,465 | 5,906–59,060 | 1,476 | 456–2,738 |  |
| 2 | 26,927 | 6,135–61,353 | 2,548 | 477–6,206 | ⚠ HP below zone 1 |
| 3 | 27,929 | 6,364–63,636 | 2,620 | 492–8,206 |  |
| 4 | 31,234 | 6,591–82,388 | 2,875 | 546–8,187 |  |
| 5 | 32,232 | 6,817–73,856 | 3,053 | 751–6,457 |  |
| 6 | 40,850 | 7,057–98,794 | 3,202 | 534–8,005 |  |
| 7 | 36,419 | 7,268–90,846 | 3,448 | 964–10,173 | ⚠ HP below zone 6 |
| 8 | 48,413 | 7,506–112,589 | 3,674 | 708–14,169 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 2,076 (22,968) | 4,511 (23,859) | 3,542 (24,747) | 4,457 (25,632) | 4,164 (26,512) | 4,358 (27,443) | 4,997 (28,263) | 3,542 (29,190) |
| brute | 2,206 (59,060) | 4,774 (61,353) | 5,881 (63,636) | 6,595 (65,910) | 4,853 (68,175) | 6,967 (98,794) | 8,388 (72,677) | 8,771 (112,589) |
| caster | 1,569 (18,046) | 2,101 (18,747) | 2,087 (19,444) | 2,877 (20,139) | 2,239 (20,831) | 2,568 (21,562) | 2,945 (22,207) | 2,227 (22,935) |
| fodder | 1,232 (19,687) | 2,041 (22,496) | 1,616 (19,091) | 2,098 (21,970) | 2,377 (24,997) | 2,301 (28,227) | 2,650 (29,071) | 2,733 (32,526) |
| hazard | 1,198 (26,249) | 1,910 (27,268) | 2,872 (36,768) | 1,819 (29,293) | 2,700 (36,360) | 3,113 (31,363) | 2,677 (32,301) | 4,048 (66,719) |
| ranged | 1,027 (16,406) | 1,671 (17,042) | 2,462 (17,677) | 2,160 (18,308) | 2,231 (18,937) | 2,001 (19,602) | 2,677 (30,282) | 2,277 (20,850) |
| support | 941 (18,046) | 1,838 (18,747) | — | 2,126 (20,139) | 4,262 (20,831) | 2,140 (21,562) | 2,209 (22,207) | 2,922 (22,935) |
| swarm | 456 (5,906) | 716 (6,135) | 574 (6,364) | 773 (6,591) | 845 (6,817) | 623 (7,057) | 1,107 (7,268) | 1,012 (7,506) |
| tank | 1,854 (49,217) | 3,879 (51,127) | 3,467 (53,030) | 3,745 (82,388) | 4,477 (73,856) | 3,975 (76,448) | 4,176 (90,846) | 4,605 (84,442) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 797,314 / 1,195,972 / 1,195,972 | 3,189,257 | 5,916 / 6,497 / 7,462 | 11,623 |  |
| 2 | Mother Spore | 3 | 886,549 / 1,329,823 / 1,329,823 | 3,546,195 | 4,582 / 6,951 / 8,529 | 13,511 |  |
| 3 | The Bloatking | 3 | 986,360 / 1,479,540 / 1,479,540 | 3,945,439 | 5,541 / 7,142 / 8,698 | 11,328 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 1,011,885 / 1,517,827 / 1,517,827 | 4,047,540 | 6,617 / 9,269 / 11,030 | 15,382 |  |
| 5 | Foreman Ignatius | 3 | 1,546,205 / 1,288,505 / 1,288,505 | 4,123,214 | 7,520 / 10,897 / 12,700 | 22,151 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 527,065 / 1,844,726 / 1,844,726 | 4,216,516 | 7,190 / 10,918 / 11,943 | 20,211 |  |
| 7 | Archmagister Tock | 3 | 1,288,555 / 1,503,314 / 1,503,314 | 4,295,183 | 10,699 / 16,196 / 19,192 | 24,426 |  |
| 8 | The Landlord | 4 | 1,467,411 / 1,424,252 / 1,424,251 / 1,709,102 | 6,025,015 | 12,453 / 15,850 / 23,367 / 19,805 | 35,323 |  |

### NG+7

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 34,149 | 6,845–68,450 | 1,605 | 496–2,976 |  |
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
| assassin | 2,257 (26,619) | 4,904 (27,653) | 3,850 (28,682) | 4,845 (29,707) | 4,526 (30,728) | 4,737 (31,806) | 5,432 (32,756) | 3,850 (33,830) |
| brute | 2,397 (68,450) | 5,189 (71,107) | 6,392 (73,753) | 7,169 (76,389) | 5,275 (79,014) | 7,573 (114,500) | 9,118 (84,231) | 9,534 (130,489) |
| caster | 1,705 (20,915) | 2,283 (21,727) | 2,269 (22,536) | 3,127 (23,341) | 2,433 (24,143) | 2,792 (24,990) | 3,201 (25,737) | 2,420 (26,581) |
| fodder | 1,339 (22,817) | 2,218 (26,073) | 1,756 (22,126) | 2,280 (25,463) | 2,584 (28,972) | 2,502 (32,714) | 2,881 (33,692) | 2,970 (37,697) |
| hazard | 1,302 (30,422) | 2,076 (31,603) | 3,122 (42,613) | 1,978 (33,951) | 2,935 (42,141) | 3,384 (36,349) | 2,910 (37,436) | 4,401 (77,327) |
| ranged | 1,116 (19,014) | 1,816 (19,752) | 2,676 (20,487) | 2,348 (21,219) | 2,425 (21,948) | 2,175 (22,718) | 2,910 (35,096) | 2,475 (24,165) |
| support | 1,023 (20,915) | 1,998 (21,727) | — | 2,311 (23,341) | 4,633 (24,143) | 2,326 (24,990) | 2,401 (25,737) | 3,177 (26,581) |
| swarm | 496 (6,845) | 778 (7,111) | 624 (7,375) | 840 (7,639) | 919 (7,901) | 677 (8,179) | 1,203 (8,423) | 1,100 (8,699) |
| tank | 2,015 (57,042) | 4,216 (59,256) | 3,769 (61,461) | 4,071 (95,486) | 4,867 (85,598) | 4,320 (88,601) | 4,540 (105,289) | 5,006 (97,867) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 924,075 / 1,386,112 / 1,386,112 | 3,696,299 | 6,431 / 7,062 / 8,111 | 12,634 |  |
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
| NG+1 | L87 · ilvl 9 · epic +4 | L100 · ilvl 10 · epic +5 | L113 · ilvl 11 · epic +6 | L125 · ilvl 12 · epic +6 | L138 · ilvl 13 · epic +6 | L151 · ilvl 14 · epic +6 | L166 · ilvl 15 · epic +6 | L181 · ilvl 16 · epic +6 |
| NG+2 | L196 · ilvl 17 · epic +7 | L210 · ilvl 18 · epic +8 | L223 · ilvl 19 · epic +9 | L236 · ilvl 20 · epic +9 | L249 · ilvl 21 · epic +9 | L263 · ilvl 22 · epic +9 | L279 · ilvl 23 · epic +9 | L294 · ilvl 24 · epic +9 |
| NG+3 | L309 · ilvl 25 · epic +10 | L323 · ilvl 26 · epic +11 | L336 · ilvl 27 · epic +12 | L350 · ilvl 28 · epic +12 | L364 · ilvl 29 · epic +12 | L379 · ilvl 30 · epic +12 | L395 · ilvl 31 · epic +12 | L411 · ilvl 32 · epic +12 |
| NG+4 | L426 · ilvl 33 · epic +13 | L441 · ilvl 34 · epic +14 | L456 · ilvl 35 · epic +15 | L470 · ilvl 36 · epic +15 | L484 · ilvl 37 · epic +15 | L499 · ilvl 38 · epic +15 | L516 · ilvl 39 · epic +15 | L533 · ilvl 40 · epic +15 |
| NG+5 | L550 · ilvl 41 · epic +15 | L566 · ilvl 42 · epic +15 | L581 · ilvl 43 · epic +15 | L595 · ilvl 44 · epic +15 | L609 · ilvl 45 · epic +15 | L624 · ilvl 46 · epic +15 | L642 · ilvl 47 · epic +15 | L659 · ilvl 48 · epic +15 |
| NG+6 | L676 · ilvl 49 · epic +15 | L693 · ilvl 50 · epic +15 | L708 · ilvl 51 · epic +15 | L724 · ilvl 52 · epic +15 | L739 · ilvl 53 · epic +15 | L756 · ilvl 54 · epic +15 | L774 · ilvl 55 · epic +15 | L793 · ilvl 56 · epic +15 |
| NG+7 | L811 · ilvl 57 · epic +15 | L828 · ilvl 58 · epic +15 | L845 · ilvl 59 · epic +15 | L861 · ilvl 60 · epic +15 | L876 · ilvl 61 · epic +15 | L893 · ilvl 62 · epic +15 | L913 · ilvl 63 · epic +15 | L932 · ilvl 64 · epic +15 |
| NG+10 | L1250 · ilvl 81 · epic +15 | L1269 · ilvl 82 · epic +15 | L1287 · ilvl 83 · epic +15 | L1305 · ilvl 84 · epic +15 | L1323 · ilvl 85 · epic +15 | L1342 · ilvl 86 · epic +15 | L1364 · ilvl 87 · epic +15 | L1386 · ilvl 88 · epic +15 |

### First playthrough

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 40 dps · 2.3s / 63s · 17.7 / 3.7 hits | 64 dps · 1.9s / 87s · 23.2 / 3.1 hits | 97 dps · 1.7s / 78s · 19.4 / 3.9 hits | 149 dps · 1.5s / 70s · 17.8 / 3.2 hits | 235 dps · 1.1s / 73s · 15.4 / 2.2 hits | 375 dps · 0.9s / 50s · 16.6 / 2.8 hits | 484 dps · 0.7s / 43s · 17.6 / 3 hits | 614 dps · 0.8s / 92s · 18.2 / 1.4 hits |
| Slicey: twin daggers | 25 dps · 3.6s / 100s · 13 / 2.7 hits | 40 dps · 3s / 139s · 17.4 / 2.4 hits | 61 dps · 2.7s / 123s · 14.8 / 3 hits | 96 dps · 2.3s / 110s · 13.8 / 2.5 hits | 137 dps · 1.8s / 125s · 12.1 / 1.7 hits | 202 dps · 1.8s / 93s · 13.2 / 2.2 hits | 242 dps · 1.5s / 87s · 14.2 / 2.4 hits | 290 dps · 1.8s / 194s · 15.2 / 1.1 hits |
| Quality: longsword + shield | 33 dps · 2.7s / 76s · 16.8 / 3.5 hits | 51 dps · 2.4s / 110s · 22.4 / 3 hits | 76 dps · 2.2s / 99s · 19 / 3.8 hits | 116 dps · 1.9s / 91s · 17.7 / 3.2 hits | 164 dps · 1.5s / 104s · 15.5 / 2.2 hits | 239 dps · 1.5s / 79s · 16.7 / 2.8 hits | 288 dps · 1.2s / 73s · 18 / 3 hits | 334 dps · 1.6s / 169s · 18.9 / 1.4 hits |
| Bow (Slicey) | 26 dps · 3.5s / 97s · 12.2 / 2.5 hits | 40 dps · 3s / 138s · 16.5 / 2.2 hits | 60 dps · 2.8s / 126s · 14.1 / 2.8 hits | 95 dps · 2.3s / 111s · 13.3 / 2.4 hits | 134 dps · 1.9s / 128s · 11.7 / 1.7 hits | 195 dps · 1.8s / 97s · 12.7 / 2.1 hits | 231 dps · 1.5s / 91s · 13.8 / 2.3 hits | 267 dps · 2s / 211s · 14.8 / 1.1 hits |
| Crossbow (Bonk) | 27 dps · 3.3s / 94s · 17.7 / 3.7 hits | 42 dps · 2.9s / 134s · 23.2 / 3.1 hits | 62 dps · 2.7s / 122s · 19.4 / 3.9 hits | 94 dps · 2.3s / 112s · 17.8 / 3.2 hits | 137 dps · 1.8s / 125s · 15.4 / 2.2 hits | 199 dps · 1.8s / 95s · 16.6 / 2.8 hits | 236 dps · 1.5s / 89s · 17.6 / 3 hits | 279 dps · 1.9s / 202s · 18.2 / 1.4 hits |
| Brain caster: staff spells | 37 dps · 2.5s / 69s · 12.2 / 2.5 hits | 63 dps · 1.9s / 89s · 16.5 / 2.2 hits | 95 dps · 1.7s / 80s · 14.1 / 2.8 hits | 138 dps · 1.6s / 76s · 13.3 / 2.4 hits | 189 dps · 1.3s / 91s · 11.7 / 1.7 hits | 266 dps · 1.3s / 71s · 12.7 / 2.1 hits | 316 dps · 1.1s / 67s · 13.8 / 2.3 hits | 371 dps · 1.4s / 152s · 14.8 / 1.1 hits |
| Prayer caster: talisman spells | 36 dps · 2.5s / 70s · 13 / 2.7 hits | 33 dps · 3.7s / 170s · 17.4 / 2.4 hits | 48 dps · 3.5s / 158s · 14.8 / 3 hits | 72 dps · 3s / 146s · 13.8 / 2.5 hits | 100 dps · 2.5s / 170s · 12.1 / 1.7 hits | 144 dps · 2.5s / 131s · 13.2 / 2.2 hits | 172 dps · 2s / 122s · 14.2 / 2.4 hits | 206 dps · 2.5s / 274s · 15.2 / 1.1 hits |

- Brain caster: staff spells: Z1 Void Rift, Frost Lance, Fireball; spells 33 + weapon 4 · Z2 Void Rift, Arcane Beam, Frost Lance; spells 61 + weapon 2 · Z3 Meteor, Void Rift, Arcane Beam; spells 90 + weapon 5 · Z4 Meteor, Void Rift, Arcane Beam; spells 130 + weapon 7 · Z5 Meteor, Void Rift, Arcane Beam; spells 178 + weapon 10 · Z6 Meteor, Void Rift, Arcane Beam; spells 251 + weapon 15 · Z7 Meteor, Void Rift, Arcane Beam; spells 299 + weapon 17 · Z8 Meteor, Void Rift, Arcane Beam; spells 351 + weapon 20
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 13 + weapon 23 · Z2 Sunray, Purify; spells 19 + weapon 14 · Z3 Sunray, Purify; spells 27 + weapon 21 · Z4 Sunray, Purify; spells 40 + weapon 32 · Z5 Sunray, Purify; spells 55 + weapon 45 · Z6 Sunray, Purify; spells 78 + weapon 65 · Z7 Sunray, Purify; spells 93 + weapon 79 · Z8 Sunray, Purify; spells 111 + weapon 95

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 76 | 63 | 100 | 1.6 |
| 2 | 134 | 87 | 170 | 1.9 |
| 3 | 122 | 78 | 158 | 2 |
| 4 | 110 | 70 | 146 | 2.1 |
| 5 | 125 | 73 | 170 | 2.3 |
| 6 | 93 | 50 | 131 | 2.6 |
| 7 | 87 | 43 | 122 | 2.8 |
| 8 | 194 | 92 | 274 | 3 |

### NG+1

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 849 dps · 2.3s / 143s · 18.2 / 2 hits | 1,158 dps · 1.6s / 141s · 15.2 / 2.1 hits | 1,493 dps · 1.4s / 135s · 17.8 / 3 hits | 1,736 dps · 1.4s / 135s · 15.9 / 2.4 hits | 2,005 dps · 1.3s / 136s · 13.5 / 1.4 hits | 2,296 dps · 1.5s / 137s · 15.1 / 1.7 hits | 2,698 dps · 1.2s / 136s · 17.6 / 2 hits | 2,942 dps · 1.5s / 218s · 14 / 1 hits ⚠1-shot |
| Slicey: twin daggers | 405 dps · 4.9s / 299s · 15.3 / 1.7 hits | 555 dps · 3.4s / 294s · 12.8 / 1.7 hits | 732 dps · 2.8s / 275s · 15 / 2.5 hits | 870 dps · 2.7s / 270s · 13.4 / 2 hits | 1,028 dps · 2.5s / 265s · 11.3 / 1.2 hits | 1,198 dps · 2.9s / 263s · 12.5 / 1.4 hits | 1,416 dps · 2.3s / 259s · 14.7 / 1.7 hits | 1,552 dps · 2.9s / 414s · 11.7 / 0.8 hits ⚠1-shot |
| Quality: longsword + shield | 427 dps · 4.7s / 284s · 18.9 / 2.1 hits | 542 dps · 3.5s / 301s · 15.9 / 2.2 hits | 668 dps · 3.1s / 301s · 18.6 / 3.1 hits | 749 dps · 3.2s / 313s · 16.6 / 2.5 hits | 841 dps · 3.1s / 324s · 14.1 / 1.5 hits | 932 dps · 3.7s / 338s · 15.8 / 1.8 hits | 1,048 dps · 3.1s / 350s · 18.4 / 2.1 hits | 1,208 dps · 3.7s / 532s · 14.7 / 1 hits |
| Bow (Slicey) | 371 dps · 5.4s / 327s · 15 / 1.7 hits | 498 dps · 3.8s / 327s · 12.6 / 1.7 hits | 645 dps · 3.2s / 312s · 14.8 / 2.5 hits | 758 dps · 3.1s / 310s · 13.2 / 2 hits | 894 dps · 2.9s / 305s · 11.1 / 1.2 hits | 1,032 dps · 3.3s / 305s · 12.3 / 1.4 hits | 1,204 dps · 2.7s / 304s · 14.5 / 1.7 hits | 1,341 dps · 3.3s / 479s · 11.5 / 0.8 hits ⚠1-shot |
| Crossbow (Bonk) | 378 dps · 5.3s / 320s · 18.2 / 2 hits | 506 dps · 3.8s / 322s · 15.2 / 2.1 hits | 667 dps · 3.1s / 302s · 17.8 / 3 hits | 782 dps · 3s / 300s · 15.9 / 2.4 hits | 910 dps · 2.8s / 300s · 13.5 / 1.4 hits | 1,049 dps · 3.3s / 300s · 15.1 / 1.7 hits | 1,222 dps · 2.6s / 300s · 17.6 / 2 hits | 1,335 dps · 3.3s / 481s · 14 / 1 hits ⚠1-shot |
| Brain caster: staff spells | 489 dps · 4.1s / 248s · 15 / 1.7 hits | 631 dps · 3s / 258s · 12.6 / 1.7 hits | 798 dps · 2.6s / 252s · 14.8 / 2.5 hits | 911 dps · 2.6s / 258s · 13.2 / 2 hits | 1,040 dps · 2.5s / 262s · 11.1 / 1.2 hits | 1,178 dps · 2.9s / 267s · 12.3 / 1.4 hits | 1,264 dps · 2.5s / 290s · 14.9 / 1.7 hits | 1,341 dps · 3.3s / 479s · 11.5 / 0.8 hits ⚠1-shot |
| Prayer caster: talisman spells | 280 dps · 7.1s / 433s · 15.3 / 1.7 hits | 369 dps · 5.2s / 441s · 12.8 / 1.7 hits | 476 dps · 4.3s / 423s · 15 / 2.5 hits | 552 dps · 4.3s / 425s · 13.4 / 2 hits | 643 dps · 4s / 424s · 11.3 / 1.2 hits | 739 dps · 4.6s / 426s · 12.5 / 1.4 hits | 805 dps · 4s / 455s · 15.1 / 1.7 hits | 861 dps · 5.1s / 746s · 11.7 / 0.8 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 465 + weapon 24 · Z2 Meteor, Void Rift, Arcane Beam; spells 601 + weapon 30 · Z3 Meteor, Void Rift, Arcane Beam; spells 761 + weapon 37 · Z4 Meteor, Void Rift, Arcane Beam; spells 870 + weapon 41 · Z5 Meteor, Void Rift, Arcane Beam; spells 995 + weapon 45 · Z6 Meteor, Void Rift, Arcane Beam; spells 1,128 + weapon 50 · Z7 Meteor, Void Rift, Arcane Beam; spells 1,209 + weapon 55 · Z8 Meteor, Void Rift, Arcane Beam; spells 1,281 + weapon 60
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 150 + weapon 130 · Z2 Sunray, Purify; spells 196 + weapon 173 · Z3 Sunray, Purify; spells 252 + weapon 224 · Z4 Sunray, Purify; spells 291 + weapon 261 · Z5 Sunray, Purify; spells 336 + weapon 307 · Z6 Sunray, Purify; spells 384 + weapon 355 · Z7 Sunray, Purify; spells 416 + weapon 389 · Z8 Sunray, Purify; spells 441 + weapon 420

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 299 | 143 | 433 | 3 |
| 2 | 301 | 141 | 441 | 3.1 |
| 3 | 301 | 135 | 423 | 3.1 |
| 4 | 300 | 135 | 425 | 3.1 |
| 5 | 300 | 136 | 424 | 3.1 |
| 6 | 300 | 137 | 426 | 3.1 |
| 7 | 300 | 136 | 455 | 3.4 |
| 8 | 479 | 218 | 746 | 3.4 |

### NG+2

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 3,390 dps · 2s / 219s · 18.3 / 2.1 hits | 3,860 dps · 1.7s / 220s · 15 / 2.1 hits | 4,377 dps · 1.6s / 221s · 16.5 / 2.8 hits | 4,633 dps · 1.7s / 220s · 14.2 / 2.2 hits | 4,878 dps · 1.7s / 220s · 11.3 / 1.2 hits | 5,140 dps · 2.1s / 220s · 12.2 / 1.4 hits | 5,405 dps · 1.9s / 221s · 14.3 / 1.6 hits | 5,702 dps · 2.4s / 303s · 10.6 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 1,794 dps · 3.8s / 413s · 15.3 / 1.7 hits | 2,045 dps · 3.2s / 416s · 12.6 / 1.7 hits | 2,319 dps · 2.9s / 416s · 13.9 / 2.3 hits | 2,463 dps · 3.2s / 414s · 12 / 1.8 hits | 2,595 dps · 3.2s / 414s · 9.5 / 1 hits | 2,742 dps · 4s / 413s · 10.3 / 1.2 hits | 2,885 dps · 3.5s / 414s · 12.1 / 1.4 hits | 3,030 dps · 4.6s / 571s · 9.1 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 1,510 dps · 4.5s / 491s · 18.9 / 2.1 hits | 1,847 dps · 3.5s / 460s · 15.4 / 2.1 hits | 2,203 dps · 3.1s / 439s · 17.2 / 2.9 hits | 2,446 dps · 3.2s / 417s · 14.9 / 2.3 hits | 2,717 dps · 3.1s / 395s · 11.8 / 1.2 hits | 3,025 dps · 3.6s / 374s · 12.8 / 1.5 hits | 3,360 dps · 3s / 355s · 15 / 1.7 hits | 3,715 dps · 3.7s / 465s · 11.2 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 1,544 dps · 4.4s / 480s · 15.1 / 1.7 hits | 1,758 dps · 3.7s / 484s · 12.5 / 1.7 hits | 2,011 dps · 3.4s / 480s · 13.7 / 2.3 hits | 2,129 dps · 3.7s / 479s · 11.8 / 1.8 hits | 2,242 dps · 3.7s / 479s · 9.4 / 1 hits ⚠1-shot | 2,362 dps · 4.6s / 479s · 10.2 / 1.2 hits | 2,483 dps · 4.1s / 481s · 11.9 / 1.4 hits | 2,606 dps · 5.3s / 663s · 9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 1,557 dps · 4.4s / 477s · 18.3 / 2.1 hits | 1,773 dps · 3.6s / 480s · 15 / 2.1 hits | 2,010 dps · 3.4s / 480s · 16.5 / 2.8 hits | 2,129 dps · 3.7s / 479s · 14.2 / 2.2 hits | 2,242 dps · 3.7s / 479s · 11.3 / 1.2 hits | 2,363 dps · 4.6s / 479s · 12.2 / 1.4 hits | 2,485 dps · 4.1s / 480s · 14.3 / 1.6 hits | 2,622 dps · 5.3s / 659s · 10.6 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 1,529 dps · 4.5s / 485s · 15.1 / 1.7 hits | 1,731 dps · 3.7s / 491s · 12.5 / 1.7 hits | 1,944 dps · 3.5s / 497s · 13.7 / 2.3 hits | 2,039 dps · 3.9s / 500s · 11.8 / 1.8 hits | 2,135 dps · 3.9s / 503s · 9.4 / 1 hits ⚠1-shot | 2,230 dps · 4.9s / 508s · 10.2 / 1.2 hits | 2,327 dps · 4.3s / 513s · 12.1 / 1.4 hits | 2,423 dps · 5.7s / 714s · 9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 987 dps · 6.9s / 751s · 15.3 / 1.7 hits | 1,122 dps · 5.8s / 758s · 12.6 / 1.7 hits | 1,272 dps · 5.4s / 760s · 13.9 / 2.3 hits | 1,340 dps · 5.9s / 761s · 12 / 1.8 hits | 1,410 dps · 6s / 761s · 9.5 / 1 hits | 1,479 dps · 7.4s / 765s · 10.3 / 1.2 hits | 1,550 dps · 6.5s / 770s · 12.2 / 1.4 hits | 1,621 dps · 8.6s / 1,067s · 9.1 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 1,459 + weapon 70 · Z2 Meteor, Void Rift, Arcane Beam; spells 1,649 + weapon 81 · Z3 Meteor, Void Rift, Arcane Beam; spells 1,850 + weapon 93 · Z4 Meteor, Void Rift, Arcane Beam; spells 1,939 + weapon 100 · Z5 Meteor, Void Rift, Arcane Beam; spells 2,028 + weapon 107 · Z6 Meteor, Void Rift, Arcane Beam; spells 2,117 + weapon 114 · Z7 Meteor, Void Rift, Arcane Beam; spells 2,206 + weapon 121 · Z8 Meteor, Void Rift, Arcane Beam; spells 2,294 + weapon 129
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 503 + weapon 485 · Z2 Sunray, Purify; spells 568 + weapon 554 · Z3 Sunray, Purify; spells 637 + weapon 634 · Z4 Sunray, Purify; spells 668 + weapon 672 · Z5 Sunray, Purify; spells 698 + weapon 711 · Z6 Sunray, Purify; spells 729 + weapon 750 · Z7 Sunray, Purify; spells 760 + weapon 790 · Z8 Sunray, Purify; spells 790 + weapon 831

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 480 | 219 | 751 | 3.4 |
| 2 | 480 | 220 | 758 | 3.4 |
| 3 | 480 | 221 | 760 | 3.4 |
| 4 | 479 | 220 | 761 | 3.5 |
| 5 | 479 | 220 | 761 | 3.5 |
| 6 | 479 | 220 | 765 | 3.5 |
| 7 | 480 | 221 | 770 | 3.5 |
| 8 | 659 | 303 | 1,067 | 3.5 |

### NG+3

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 6,408 dps · 2.1s / 226s · 21.1 / 2.4 hits | 7,105 dps · 1.7s / 225s · 16.4 / 2.3 hits | 7,841 dps · 1.6s / 226s · 17.6 / 2.9 hits | 8,178 dps · 1.7s / 222s · 14.6 / 2.2 hits | 8,518 dps · 1.7s / 217s · 11.1 / 1.2 hits | 8,841 dps · 2.1s / 214s · 11.7 / 1.3 hits | 9,188 dps · 1.8s / 210s · 13.4 / 1.5 hits | 9,537 dps · 2.3s / 284s · 9.5 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 3,388 dps · 4s / 428s · 18.5 / 2.1 hits | 3,758 dps · 3.2s / 426s · 14.4 / 2 hits | 4,158 dps · 3s / 426s · 15.4 / 2.6 hits | 4,339 dps · 3.2s / 419s · 12.8 / 2 hits | 4,521 dps · 3.2s / 410s · 9.8 / 1 hits | 4,694 dps · 3.9s / 403s · 10.3 / 1.2 hits | 4,879 dps · 3.4s / 395s · 11.8 / 1.4 hits | 5,077 dps · 4.3s / 533s · 8.4 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 4,325 dps · 3.1s / 335s · 22.8 / 2.6 hits | 4,999 dps · 2.4s / 320s · 17.8 / 2.4 hits | 5,710 dps · 2.2s / 310s · 19 / 3.2 hits | 6,208 dps · 2.3s / 293s · 15.8 / 2.4 hits | 6,620 dps · 2.2s / 280s · 12 / 1.3 hits | 6,898 dps · 2.7s / 274s · 12.7 / 1.4 hits | 7,169 dps · 2.3s / 269s · 14.5 / 1.7 hits | 7,442 dps · 2.9s / 364s · 10.3 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 2,912 dps · 4.6s / 498s · 18.5 / 2.1 hits | 3,250 dps · 3.7s / 493s · 14.4 / 2 hits | 3,586 dps · 3.5s / 494s · 15.4 / 2.6 hits | 3,740 dps · 3.8s / 486s · 12.8 / 2 hits | 3,895 dps · 3.7s / 475s · 9.8 / 1 hits | 4,042 dps · 4.5s / 468s · 10.3 / 1.2 hits | 4,200 dps · 3.9s / 459s · 11.8 / 1.4 hits | 4,359 dps · 5s / 621s · 8.4 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 2,916 dps · 4.6s / 497s · 21.1 / 2.4 hits | 3,233 dps · 3.8s / 495s · 16.4 / 2.3 hits | 3,568 dps · 3.5s / 497s · 17.6 / 2.9 hits | 3,755 dps · 3.7s / 484s · 14.6 / 2.2 hits | 3,912 dps · 3.7s / 473s · 11.1 / 1.2 hits | 4,061 dps · 4.5s / 466s · 11.7 / 1.3 hits | 4,220 dps · 3.9s / 457s · 13.4 / 1.5 hits | 4,382 dps · 5s / 618s · 9.5 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 2,682 dps · 5s / 540s · 18.5 / 2.1 hits | 2,952 dps · 4.1s / 542s · 14.4 / 2 hits | 3,235 dps · 3.9s / 548s · 15.4 / 2.6 hits | 3,352 dps · 4.2s / 542s · 12.8 / 2 hits | 3,467 dps · 4.2s / 534s · 9.8 / 1 hits | 3,583 dps · 5.1s / 529s · 10.3 / 1.2 hits | 3,698 dps · 4.4s / 522s · 11.8 / 1.4 hits | 3,814 dps · 5.7s / 709s · 8.4 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 1,814 dps · 7.4s / 799s · 18.5 / 2.1 hits | 2,005 dps · 6.1s / 799s · 14.4 / 2 hits | 2,205 dps · 5.7s / 803s · 15.4 / 2.6 hits | 2,298 dps · 6.1s / 791s · 12.8 / 2 hits | 2,386 dps · 6.1s / 776s · 9.8 / 1 hits | 2,475 dps · 7.4s / 765s · 10.3 / 1.2 hits | 2,565 dps · 6.4s / 752s · 11.8 / 1.4 hits | 2,654 dps · 8.2s / 1,019s · 8.4 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 2,535 + weapon 147 · Z2 Meteor, Void Rift, Arcane Beam; spells 2,787 + weapon 165 · Z3 Meteor, Void Rift, Arcane Beam; spells 3,051 + weapon 184 · Z4 Meteor, Void Rift, Arcane Beam; spells 3,156 + weapon 195 · Z5 Meteor, Void Rift, Arcane Beam; spells 3,262 + weapon 205 · Z6 Meteor, Void Rift, Arcane Beam; spells 3,368 + weapon 215 · Z7 Meteor, Void Rift, Arcane Beam; spells 3,473 + weapon 225 · Z8 Meteor, Void Rift, Arcane Beam; spells 3,579 + weapon 235
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 873 + weapon 941 · Z2 Sunray, Purify; spells 960 + weapon 1,045 · Z3 Sunray, Purify; spells 1,051 + weapon 1,155 · Z4 Sunray, Purify; spells 1,087 + weapon 1,211 · Z5 Sunray, Purify; spells 1,123 + weapon 1,263 · Z6 Sunray, Purify; spells 1,160 + weapon 1,315 · Z7 Sunray, Purify; spells 1,196 + weapon 1,368 · Z8 Sunray, Purify; spells 1,233 + weapon 1,422

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 497 | 226 | 799 | 3.5 |
| 2 | 493 | 225 | 799 | 3.5 |
| 3 | 494 | 226 | 803 | 3.6 |
| 4 | 484 | 222 | 791 | 3.6 |
| 5 | 473 | 217 | 776 | 3.6 |
| 6 | 466 | 214 | 765 | 3.6 |
| 7 | 457 | 210 | 752 | 3.6 |
| 8 | 618 | 284 | 1,019 | 3.6 |

### NG+4

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 10,441 dps · 2s / 218s · 22.8 / 2.6 hits | 11,342 dps · 1.7s / 223s · 17.6 / 2.4 hits | 12,306 dps · 1.6s / 227s · 18.5 / 3.1 hits | 12,646 dps · 1.8s / 227s · 15.3 / 2.3 hits | 12,985 dps · 1.8s / 225s · 11.5 / 1.2 hits | 13,325 dps · 2.2s / 224s · 12.1 / 1.4 hits | 13,665 dps · 1.9s / 223s · 13.8 / 1.6 hits | 14,005 dps · 2.5s / 305s · 9.7 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 5,561 dps · 3.8s / 410s · 20.1 / 2.3 hits | 6,041 dps · 3.2s / 418s · 15.5 / 2.1 hits | 6,513 dps · 3s / 429s · 16.3 / 2.7 hits | 6,693 dps · 3.3s / 429s · 13.4 / 2.1 hits | 6,873 dps · 3.3s / 425s · 10.1 / 1.1 hits | 7,053 dps · 4.1s / 424s · 10.6 / 1.2 hits | 7,233 dps · 3.6s / 421s · 12.1 / 1.4 hits | 7,413 dps · 4.6s / 576s · 8.5 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 8,131 dps · 2.6s / 280s · 24.7 / 2.8 hits | 8,833 dps · 2.2s / 286s · 19 / 2.6 hits | 9,544 dps · 2.1s / 293s · 20 / 3.4 hits | 9,808 dps · 2.3s / 293s · 16.5 / 2.5 hits | 10,071 dps · 2.3s / 290s · 12.5 / 1.3 hits | 10,335 dps · 2.8s / 289s · 13 / 1.5 hits | 10,598 dps · 2.4s / 287s · 14.9 / 1.7 hits | 10,862 dps · 3.2s / 393s · 10.5 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 4,771 dps · 4.4s / 478s · 20.1 / 2.3 hits | 5,182 dps · 3.7s / 487s · 15.5 / 2.1 hits | 5,633 dps · 3.5s / 496s · 16.3 / 2.7 hits | 5,824 dps · 3.8s / 493s · 13.4 / 2.1 hits | 5,980 dps · 3.8s / 489s · 10.1 / 1.1 hits | 6,137 dps · 4.7s / 487s · 10.6 / 1.2 hits | 6,293 dps · 4.1s / 484s · 12.1 / 1.4 hits | 6,450 dps · 5.3s / 662s · 8.5 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 4,798 dps · 4.4s / 475s · 22.8 / 2.6 hits | 5,212 dps · 3.7s / 484s · 17.6 / 2.4 hits | 5,656 dps · 3.5s / 494s · 18.5 / 3.1 hits | 5,813 dps · 3.8s / 494s · 15.3 / 2.3 hits | 5,969 dps · 3.8s / 490s · 11.5 / 1.2 hits | 6,125 dps · 4.7s / 488s · 12.1 / 1.4 hits | 6,281 dps · 4.1s / 485s · 13.8 / 1.6 hits | 6,437 dps · 5.3s / 663s · 9.7 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 4,143 dps · 5.1s / 550s · 20.1 / 2.3 hits | 4,480 dps · 4.3s / 563s · 15.5 / 2.1 hits | 4,835 dps · 4.1s / 578s · 16.3 / 2.7 hits | 4,973 dps · 4.5s / 577s · 13.4 / 2.1 hits | 5,108 dps · 4.5s / 572s · 10.1 / 1.1 hits | 5,244 dps · 5.5s / 570s · 10.6 / 1.2 hits | 5,380 dps · 4.8s / 566s · 12.1 / 1.4 hits | 5,518 dps · 6.2s / 774s · 8.5 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 2,898 dps · 7.3s / 787s · 20.1 / 2.3 hits | 3,140 dps · 6.1s / 804s · 15.5 / 2.1 hits | 3,415 dps · 5.8s / 819s · 16.3 / 2.7 hits | 3,529 dps · 6.3s / 813s · 13.4 / 2.1 hits | 3,637 dps · 6.3s / 804s · 10.1 / 1.1 hits | 3,746 dps · 7.7s / 798s · 10.6 / 1.2 hits | 3,855 dps · 6.7s / 790s · 12.1 / 1.4 hits | 3,973 dps · 8.6s / 1,075s · 8.5 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 3,882 + weapon 260 · Z2 Meteor, Void Rift, Arcane Beam; spells 4,197 + weapon 283 · Z3 Meteor, Void Rift, Arcane Beam; spells 4,523 + weapon 313 · Z4 Meteor, Void Rift, Arcane Beam; spells 4,645 + weapon 327 · Z5 Meteor, Void Rift, Arcane Beam; spells 4,768 + weapon 340 · Z6 Meteor, Void Rift, Arcane Beam; spells 4,891 + weapon 353 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,014 + weapon 367 · Z8 Meteor, Void Rift, Arcane Beam; spells 5,136 + weapon 382
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,337 + weapon 1,561 · Z2 Sunray, Purify; spells 1,445 + weapon 1,695 · Z3 Sunray, Purify; spells 1,558 + weapon 1,857 · Z4 Sunray, Purify; spells 1,600 + weapon 1,929 · Z5 Sunray, Purify; spells 1,642 + weapon 1,995 · Z6 Sunray, Purify; spells 1,684 + weapon 2,062 · Z7 Sunray, Purify; spells 1,727 + weapon 2,129 · Z8 Sunray, Purify; spells 1,769 + weapon 2,204

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 475 | 218 | 787 | 3.6 |
| 2 | 484 | 223 | 804 | 3.6 |
| 3 | 494 | 227 | 819 | 3.6 |
| 4 | 493 | 227 | 813 | 3.6 |
| 5 | 489 | 225 | 804 | 3.6 |
| 6 | 487 | 224 | 798 | 3.6 |
| 7 | 484 | 223 | 790 | 3.5 |
| 8 | 662 | 305 | 1,075 | 3.5 |

### NG+5

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 14,344 dps · 1.8s / 190s · 26.8 / 3.1 hits | 14,684 dps · 1.6s / 207s · 19.6 / 2.7 hits | 15,024 dps · 1.6s / 225s · 19.5 / 3.3 hits | 15,364 dps · 1.7s / 226s · 16 / 2.5 hits | 15,703 dps · 1.8s / 225s · 12 / 1.3 hits | 16,043 dps · 2.2s / 225s · 12.5 / 1.4 hits | 16,383 dps · 1.9s / 224s · 14.3 / 1.7 hits | 16,723 dps · 2.5s / 308s · 10 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 7,592 dps · 3.3s / 360s · 23.5 / 2.7 hits | 7,772 dps · 3s / 391s · 17.2 / 2.4 hits | 7,952 dps · 3s / 425s · 17.2 / 2.9 hits | 8,132 dps · 3.3s / 426s · 14.1 / 2.2 hits | 8,312 dps · 3.3s / 425s · 10.5 / 1.1 hits | 8,492 dps · 4.1s / 425s · 11 / 1.2 hits | 8,671 dps · 3.6s / 424s · 12.6 / 1.5 hits | 8,851 dps · 4.7s / 583s · 8.7 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 11,125 dps · 2.3s / 245s · 29 / 3.3 hits | 11,389 dps · 2s / 267s · 21.2 / 2.9 hits | 11,652 dps · 2.1s / 290s · 21.1 / 3.5 hits | 11,916 dps · 2.2s / 291s · 17.3 / 2.7 hits | 12,179 dps · 2.3s / 290s · 13 / 1.4 hits | 12,443 dps · 2.8s / 290s · 13.5 / 1.5 hits | 12,706 dps · 2.5s / 289s · 15.4 / 1.8 hits | 12,970 dps · 3.2s / 398s · 10.8 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 6,606 dps · 3.8s / 413s · 23.5 / 2.7 hits | 6,763 dps · 3.4s / 449s · 17.2 / 2.4 hits | 6,919 dps · 3.5s / 488s · 17.2 / 2.9 hits | 7,076 dps · 3.8s / 490s · 14.1 / 2.2 hits | 7,232 dps · 3.8s / 488s · 10.5 / 1.1 hits | 7,389 dps · 4.7s / 488s · 11 / 1.2 hits | 7,545 dps · 4.1s / 487s · 12.6 / 1.5 hits | 7,701 dps · 5.4s / 670s · 8.7 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 6,593 dps · 3.8s / 414s · 26.8 / 3.1 hits | 6,750 dps · 3.4s / 450s · 19.6 / 2.7 hits | 6,906 dps · 3.5s / 489s · 19.5 / 3.3 hits | 7,062 dps · 3.8s / 491s · 16 / 2.5 hits | 7,218 dps · 3.8s / 489s · 12 / 1.3 hits | 7,374 dps · 4.7s / 489s · 12.5 / 1.4 hits | 7,530 dps · 4.1s / 488s · 14.3 / 1.7 hits | 7,687 dps · 5.4s / 671s · 10 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 5,657 dps · 4.5s / 483s · 23.5 / 2.7 hits | 5,794 dps · 4s / 524s · 17.2 / 2.4 hits | 5,928 dps · 4s / 570s · 17.2 / 2.9 hits | 6,067 dps · 4.4s / 571s · 14.1 / 2.2 hits | 6,206 dps · 4.4s / 569s · 10.5 / 1.1 hits | 6,338 dps · 5.5s / 569s · 11 / 1.2 hits | 6,471 dps · 4.8s / 568s · 12.6 / 1.5 hits | 6,603 dps · 6.3s / 781s · 8.7 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 4,091 dps · 6.2s / 667s · 23.5 / 2.7 hits | 4,202 dps · 5.5s / 722s · 17.2 / 2.4 hits | 4,306 dps · 5.6s / 784s · 17.2 / 2.9 hits | 4,426 dps · 6s / 783s · 14.1 / 2.2 hits | 4,532 dps · 6.1s / 779s · 10.5 / 1.1 hits | 4,629 dps · 7.6s / 780s · 11 / 1.2 hits | 4,727 dps · 6.6s / 778s · 12.6 / 1.5 hits | 4,824 dps · 8.6s / 1,069s · 8.7 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 5,259 + weapon 398 · Z2 Meteor, Void Rift, Arcane Beam; spells 5,382 + weapon 412 · Z3 Meteor, Void Rift, Arcane Beam; spells 5,504 + weapon 424 · Z4 Meteor, Void Rift, Arcane Beam; spells 5,627 + weapon 440 · Z5 Meteor, Void Rift, Arcane Beam; spells 5,750 + weapon 456 · Z6 Meteor, Void Rift, Arcane Beam; spells 5,872 + weapon 466 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,995 + weapon 476 · Z8 Meteor, Void Rift, Arcane Beam; spells 6,118 + weapon 485
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,811 + weapon 2,280 · Z2 Sunray, Purify; spells 1,853 + weapon 2,349 · Z3 Sunray, Purify; spells 1,896 + weapon 2,411 · Z4 Sunray, Purify; spells 1,938 + weapon 2,489 · Z5 Sunray, Purify; spells 1,980 + weapon 2,551 · Z6 Sunray, Purify; spells 2,022 + weapon 2,607 · Z7 Sunray, Purify; spells 2,065 + weapon 2,662 · Z8 Sunray, Purify; spells 2,107 + weapon 2,717

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 413 | 190 | 667 | 3.5 |
| 2 | 449 | 207 | 722 | 3.5 |
| 3 | 488 | 225 | 784 | 3.5 |
| 4 | 490 | 226 | 783 | 3.5 |
| 5 | 488 | 225 | 779 | 3.5 |
| 6 | 488 | 225 | 780 | 3.5 |
| 7 | 487 | 224 | 778 | 3.5 |
| 8 | 670 | 308 | 1,069 | 3.5 |

### NG+6

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 17,062 dps · 1.7s / 187s · 27.9 / 3.2 hits | 17,402 dps · 1.5s / 204s · 20.3 / 2.8 hits | 17,742 dps · 1.6s / 222s · 20.2 / 3.4 hits | 18,082 dps · 1.7s / 224s · 16.5 / 2.5 hits | 18,421 dps · 1.7s / 224s · 12.3 / 1.3 hits | 18,761 dps · 2.2s / 225s · 12.8 / 1.5 hits | 19,101 dps · 1.9s / 225s · 14.6 / 1.7 hits | 19,440 dps · 2.5s / 310s · 10.1 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 9,031 dps · 3.3s / 353s · 24.5 / 2.8 hits | 9,211 dps · 2.9s / 385s · 17.9 / 2.5 hits | 9,391 dps · 3s / 420s · 17.8 / 3 hits | 9,570 dps · 3.3s / 423s · 14.5 / 2.2 hits | 9,750 dps · 3.3s / 423s · 10.8 / 1.1 hits | 9,930 dps · 4.1s / 425s · 11.3 / 1.3 hits | 10,110 dps · 3.6s / 425s · 12.8 / 1.5 hits | 10,290 dps · 4.7s / 586s · 8.9 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 13,233 dps · 2.2s / 241s · 30.2 / 3.4 hits | 13,497 dps · 2s / 263s · 22 / 3 hits | 13,760 dps · 2s / 287s · 21.9 / 3.7 hits | 14,024 dps · 2.2s / 289s · 17.9 / 2.8 hits | 14,287 dps · 2.3s / 289s · 13.3 / 1.4 hits | 14,551 dps · 2.8s / 290s · 13.8 / 1.6 hits | 14,814 dps · 2.5s / 290s · 15.8 / 1.8 hits | 15,078 dps · 3.2s / 400s · 10.9 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 7,858 dps · 3.7s / 406s · 24.5 / 2.8 hits | 8,014 dps · 3.4s / 442s · 17.9 / 2.5 hits | 8,171 dps · 3.4s / 483s · 17.8 / 3 hits | 8,327 dps · 3.8s / 486s · 14.5 / 2.2 hits | 8,484 dps · 3.8s / 486s · 10.8 / 1.1 hits | 8,640 dps · 4.7s / 488s · 11.3 / 1.3 hits | 8,797 dps · 4.1s / 488s · 12.8 / 1.5 hits | 8,953 dps · 5.4s / 673s · 8.9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 7,843 dps · 3.8s / 407s · 27.9 / 3.2 hits | 7,999 dps · 3.4s / 443s · 20.3 / 2.8 hits | 8,155 dps · 3.4s / 484s · 20.2 / 3.4 hits | 8,311 dps · 3.8s / 487s · 16.5 / 2.5 hits | 8,467 dps · 3.8s / 487s · 12.3 / 1.3 hits | 8,623 dps · 4.7s / 489s · 12.8 / 1.5 hits | 8,780 dps · 4.1s / 489s · 14.6 / 1.7 hits | 8,936 dps · 5.4s / 674s · 10.1 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 6,736 dps · 4.4s / 473s · 24.5 / 2.8 hits | 6,868 dps · 3.9s / 516s · 17.9 / 2.5 hits | 7,001 dps · 4s / 564s · 17.8 / 3 hits | 7,134 dps · 4.4s / 567s · 14.5 / 2.2 hits | 7,266 dps · 4.4s / 567s · 10.8 / 1.1 hits | 7,399 dps · 5.5s / 570s · 11.3 / 1.3 hits | 7,531 dps · 4.8s / 570s · 12.8 / 1.5 hits | 7,664 dps · 6.3s / 786s · 8.9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 4,921 dps · 6s / 648s · 24.5 / 2.8 hits | 5,019 dps · 5.4s / 707s · 17.9 / 2.5 hits | 5,116 dps · 5.5s / 771s · 17.8 / 3 hits | 5,214 dps · 6s / 776s · 14.5 / 2.2 hits | 5,311 dps · 6.1s / 776s · 10.8 / 1.1 hits | 5,409 dps · 7.6s / 780s · 11.3 / 1.3 hits | 5,506 dps · 6.6s / 780s · 12.8 / 1.5 hits | 5,604 dps · 8.6s / 1,075s · 8.9 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 6,241 + weapon 495 · Z2 Meteor, Void Rift, Arcane Beam; spells 6,363 + weapon 505 · Z3 Meteor, Void Rift, Arcane Beam; spells 6,486 + weapon 515 · Z4 Meteor, Void Rift, Arcane Beam; spells 6,609 + weapon 525 · Z5 Meteor, Void Rift, Arcane Beam; spells 6,731 + weapon 535 · Z6 Meteor, Void Rift, Arcane Beam; spells 6,854 + weapon 545 · Z7 Meteor, Void Rift, Arcane Beam; spells 6,977 + weapon 554 · Z8 Meteor, Void Rift, Arcane Beam; spells 7,099 + weapon 564
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,149 + weapon 2,772 · Z2 Sunray, Purify; spells 2,192 + weapon 2,827 · Z3 Sunray, Purify; spells 2,234 + weapon 2,883 · Z4 Sunray, Purify; spells 2,276 + weapon 2,938 · Z5 Sunray, Purify; spells 2,318 + weapon 2,993 · Z6 Sunray, Purify; spells 2,361 + weapon 3,048 · Z7 Sunray, Purify; spells 2,403 + weapon 3,103 · Z8 Sunray, Purify; spells 2,445 + weapon 3,159

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 406 | 187 | 648 | 3.5 |
| 2 | 442 | 204 | 707 | 3.5 |
| 3 | 483 | 222 | 771 | 3.5 |
| 4 | 486 | 224 | 776 | 3.5 |
| 5 | 486 | 224 | 776 | 3.5 |
| 6 | 488 | 225 | 780 | 3.5 |
| 7 | 488 | 225 | 780 | 3.5 |
| 8 | 673 | 310 | 1,075 | 3.5 |

### NG+7

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 19,780 dps · 1.7s / 187s · 29.6 / 3.4 hits | 20,120 dps · 1.6s / 204s · 21.6 / 3 hits | 20,460 dps · 1.6s / 223s · 21.4 / 3.6 hits | 20,799 dps · 1.7s / 226s · 17.4 / 2.7 hits | 21,139 dps · 1.8s / 226s · 13 / 1.4 hits | 21,479 dps · 2.2s / 228s · 13.4 / 1.5 hits | 21,819 dps · 1.9s / 228s · 15.3 / 1.8 hits | 22,158 dps · 2.5s / 315s · 10.6 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 10,470 dps · 3.3s / 353s · 26 / 3 hits | 10,649 dps · 2.9s / 386s · 18.9 / 2.6 hits | 10,829 dps · 3s / 422s · 18.8 / 3.1 hits | 11,009 dps · 3.3s / 426s · 15.3 / 2.4 hits | 11,189 dps · 3.3s / 427s · 11.4 / 1.2 hits | 11,369 dps · 4.2s / 430s · 11.8 / 1.3 hits | 11,548 dps · 3.7s / 431s · 13.4 / 1.6 hits | 11,728 dps · 4.8s / 595s · 9.3 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 15,341 dps · 2.2s / 241s · 32 / 3.7 hits | 15,605 dps · 2s / 263s · 23.3 / 3.2 hits | 15,868 dps · 2s / 288s · 23.1 / 3.9 hits | 16,132 dps · 2.2s / 291s · 18.8 / 2.9 hits | 16,395 dps · 2.3s / 291s · 14 / 1.5 hits | 16,659 dps · 2.8s / 293s · 14.5 / 1.6 hits | 16,922 dps · 2.5s / 294s · 16.6 / 1.9 hits | 17,186 dps · 3.3s / 406s · 11.4 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 9,110 dps · 3.7s / 406s · 26 / 3 hits | 9,266 dps · 3.4s / 444s · 18.9 / 2.6 hits | 9,423 dps · 3.4s / 485s · 18.8 / 3.1 hits | 9,579 dps · 3.8s / 490s · 15.3 / 2.4 hits | 9,735 dps · 3.8s / 491s · 11.4 / 1.2 hits | 9,892 dps · 4.8s / 494s · 11.8 / 1.3 hits | 10,048 dps · 4.2s / 495s · 13.4 / 1.6 hits | 10,205 dps · 5.5s / 684s · 9.3 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 9,092 dps · 3.8s / 407s · 29.6 / 3.4 hits | 9,248 dps · 3.4s / 444s · 21.6 / 3 hits | 9,404 dps · 3.4s / 486s · 21.4 / 3.6 hits | 9,560 dps · 3.8s / 491s · 17.4 / 2.7 hits | 9,717 dps · 3.8s / 492s · 13 / 1.4 hits | 9,873 dps · 4.8s / 495s · 13.4 / 1.5 hits | 10,029 dps · 4.2s / 496s · 15.3 / 1.8 hits | 10,185 dps · 5.5s / 686s · 10.6 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 7,796 dps · 4.4s / 474s · 26 / 3 hits | 7,929 dps · 3.9s / 518s · 18.9 / 2.6 hits | 8,061 dps · 4s / 567s · 18.8 / 3.1 hits | 8,194 dps · 4.4s / 572s · 15.3 / 2.4 hits | 8,327 dps · 4.5s / 574s · 11.4 / 1.2 hits | 8,459 dps · 5.6s / 578s · 11.8 / 1.3 hits | 8,592 dps · 4.9s / 579s · 13.4 / 1.6 hits | 8,724 dps · 6.4s / 800s · 9.3 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 5,701 dps · 6s / 648s · 26 / 3 hits | 5,799 dps · 5.4s / 709s · 18.9 / 2.6 hits | 5,896 dps · 5.5s / 776s · 18.8 / 3.1 hits | 5,993 dps · 6s / 783s · 15.3 / 2.4 hits | 6,091 dps · 6.1s / 785s · 11.4 / 1.2 hits | 6,188 dps · 7.7s / 790s · 11.8 / 1.3 hits | 6,286 dps · 6.7s / 792s · 13.4 / 1.6 hits | 6,383 dps · 8.8s / 1,094s · 9.3 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 7,222 + weapon 574 · Z2 Meteor, Void Rift, Arcane Beam; spells 7,345 + weapon 584 · Z3 Meteor, Void Rift, Arcane Beam; spells 7,468 + weapon 594 · Z4 Meteor, Void Rift, Arcane Beam; spells 7,590 + weapon 604 · Z5 Meteor, Void Rift, Arcane Beam; spells 7,713 + weapon 614 · Z6 Meteor, Void Rift, Arcane Beam; spells 7,836 + weapon 623 · Z7 Meteor, Void Rift, Arcane Beam; spells 7,959 + weapon 633 · Z8 Meteor, Void Rift, Arcane Beam; spells 8,081 + weapon 643
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,487 + weapon 3,214 · Z2 Sunray, Purify; spells 2,530 + weapon 3,269 · Z3 Sunray, Purify; spells 2,572 + weapon 3,324 · Z4 Sunray, Purify; spells 2,614 + weapon 3,379 · Z5 Sunray, Purify; spells 2,656 + weapon 3,435 · Z6 Sunray, Purify; spells 2,699 + weapon 3,490 · Z7 Sunray, Purify; spells 2,741 + weapon 3,545 · Z8 Sunray, Purify; spells 2,783 + weapon 3,600

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 406 | 187 | 648 | 3.5 |
| 2 | 444 | 204 | 709 | 3.5 |
| 3 | 485 | 223 | 776 | 3.5 |
| 4 | 490 | 226 | 783 | 3.5 |
| 5 | 491 | 226 | 785 | 3.5 |
| 6 | 494 | 228 | 790 | 3.5 |
| 7 | 495 | 228 | 792 | 3.5 |
| 8 | 684 | 315 | 1,094 | 3.5 |

### NG+10

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 27,934 dps · 2s / 218s · 12 / 1.4 hits | 28,274 dps · 1.8s / 240s · 8.7 / 1.2 hits | 28,613 dps · 1.9s / 264s · 8.6 / 1.4 hits | 28,953 dps · 2.1s / 267s · 7 / 1.1 hits | 29,293 dps · 2.1s / 269s · 5.1 / 0.5 hits ⚠1-shot | 29,633 dps · 2.6s / 272s · 5.3 / 0.6 hits ⚠1-shot | 29,972 dps · 2.3s / 274s · 6 / 0.7 hits ⚠1-shot | 30,312 dps · 3.1s / 380s · 4.1 / 0.3 hits ⚠1-shot |
| Slicey: twin daggers | 14,785 dps · 3.8s / 413s · 10.5 / 1.2 hits | 14,965 dps · 3.4s / 453s · 7.6 / 1 hits | 15,145 dps · 3.5s / 498s · 7.5 / 1.3 hits | 15,325 dps · 3.9s / 505s · 6.1 / 0.9 hits ⚠1-shot | 15,504 dps · 4s / 509s · 4.5 / 0.5 hits ⚠1-shot | 15,684 dps · 5s / 514s · 4.7 / 0.5 hits ⚠1-shot | 15,864 dps · 4.4s / 518s · 5.3 / 0.6 hits ⚠1-shot | 16,044 dps · 5.8s / 718s · 3.6 / 0.2 hits ⚠1-shot |
| Quality: longsword + shield | 21,665 dps · 2.6s / 282s · 13 / 1.5 hits | 21,928 dps · 2.3s / 309s · 9.4 / 1.3 hits | 22,192 dps · 2.4s / 340s · 9.3 / 1.6 hits | 22,455 dps · 2.7s / 345s · 7.5 / 1.2 hits | 22,719 dps · 2.7s / 347s · 5.6 / 0.6 hits ⚠1-shot | 22,982 dps · 3.4s / 351s · 5.7 / 0.7 hits ⚠1-shot | 23,246 dps · 3s / 353s · 6.5 / 0.8 hits ⚠1-shot | 23,509 dps · 3.9s / 490s · 4.5 / 0.3 hits ⚠1-shot |
| Bow (Slicey) | 12,865 dps · 4.4s / 474s · 10.5 / 1.2 hits | 13,021 dps · 4s / 521s · 7.6 / 1 hits | 13,178 dps · 4.1s / 573s · 7.5 / 1.3 hits | 13,334 dps · 4.5s / 581s · 6.1 / 0.9 hits ⚠1-shot | 13,491 dps · 4.6s / 585s · 4.5 / 0.5 hits ⚠1-shot | 13,647 dps · 5.7s / 591s · 4.7 / 0.5 hits ⚠1-shot | 13,804 dps · 5s / 595s · 5.3 / 0.6 hits ⚠1-shot | 13,960 dps · 6.6s / 826s · 3.6 / 0.2 hits ⚠1-shot |
| Crossbow (Bonk) | 12,840 dps · 4.4s / 475s · 12 / 1.4 hits | 12,996 dps · 4s / 522s · 8.7 / 1.2 hits | 13,152 dps · 4.1s / 574s · 8.6 / 1.4 hits | 13,308 dps · 4.5s / 582s · 7 / 1.1 hits | 13,464 dps · 4.6s / 586s · 5.1 / 0.5 hits ⚠1-shot | 13,621 dps · 5.7s / 592s · 5.3 / 0.6 hits ⚠1-shot | 13,777 dps · 5.1s / 596s · 6 / 0.7 hits ⚠1-shot | 13,933 dps · 6.6s / 827s · 4.1 / 0.3 hits ⚠1-shot |
| Brain caster: staff spells | 10,978 dps · 5.1s / 556s · 10.5 / 1.2 hits | 11,111 dps · 4.6s / 611s · 7.6 / 1 hits | 11,243 dps · 4.8s / 671s · 7.5 / 1.3 hits | 11,376 dps · 5.3s / 681s · 6.1 / 0.9 hits ⚠1-shot | 11,508 dps · 5.4s / 685s · 4.5 / 0.5 hits ⚠1-shot | 11,641 dps · 6.7s / 693s · 4.7 / 0.5 hits ⚠1-shot | 11,774 dps · 5.9s / 698s · 5.3 / 0.6 hits ⚠1-shot | 11,906 dps · 7.8s / 968s · 3.6 / 0.2 hits ⚠1-shot |
| Prayer caster: talisman spells | 8,040 dps · 7s / 759s · 10.5 / 1.2 hits | 8,138 dps · 6.3s / 834s · 7.6 / 1 hits | 8,235 dps · 6.5s / 917s · 7.5 / 1.3 hits | 8,332 dps · 7.2s / 929s · 6.1 / 0.9 hits ⚠1-shot | 8,430 dps · 7.3s / 936s · 4.5 / 0.5 hits ⚠1-shot | 8,527 dps · 9.2s / 946s · 4.7 / 0.5 hits ⚠1-shot | 8,625 dps · 8.1s / 953s · 5.3 / 0.6 hits ⚠1-shot | 8,722 dps · 10.6s / 1,321s · 3.6 / 0.2 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 10,167 + weapon 811 · Z2 Meteor, Void Rift, Arcane Beam; spells 10,290 + weapon 821 · Z3 Meteor, Void Rift, Arcane Beam; spells 10,413 + weapon 831 · Z4 Meteor, Void Rift, Arcane Beam; spells 10,535 + weapon 840 · Z5 Meteor, Void Rift, Arcane Beam; spells 10,658 + weapon 850 · Z6 Meteor, Void Rift, Arcane Beam; spells 10,781 + weapon 860 · Z7 Meteor, Void Rift, Arcane Beam; spells 10,904 + weapon 870 · Z8 Meteor, Void Rift, Arcane Beam; spells 11,026 + weapon 880
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 3,502 + weapon 4,539 · Z2 Sunray, Purify; spells 3,544 + weapon 4,594 · Z3 Sunray, Purify; spells 3,586 + weapon 4,649 · Z4 Sunray, Purify; spells 3,628 + weapon 4,704 · Z5 Sunray, Purify; spells 3,671 + weapon 4,759 · Z6 Sunray, Purify; spells 3,713 + weapon 4,815 · Z7 Sunray, Purify; spells 3,755 + weapon 4,870 · Z8 Sunray, Purify; spells 3,797 + weapon 4,925

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 474 | 218 | 759 | 3.5 |
| 2 | 521 | 240 | 834 | 3.5 |
| 3 | 573 | 264 | 917 | 3.5 |
| 4 | 581 | 267 | 929 | 3.5 |
| 5 | 585 | 269 | 936 | 3.5 |
| 6 | 591 | 272 | 946 | 3.5 |
| 7 | 595 | 274 | 953 | 3.5 |
| 8 | 826 | 380 | 1,321 | 3.5 |

## 3. Gems, compared

Each gem at the level a zone 5 drop has (first playthrough) and a +0% roll, on the quality build (longsword) at zone 5. Weapon gems are compared by how much they raise sustained light-attack DPS; armour gems by how much they raise effective HP against zone 5's room hits. Families that do neither are listed with their raw value.

Gem level 7 (zone 5 drop), +0% roll. Base: 164 DPS, 11.8 average hits to die.

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
| Leech | weapon | 4% lifesteal | — | heals 7.7% max HP per 10 s of attacking |
| Vigor | weapon | −16% stamina costs | +7% sustained, +0% burst DPS |  |
| Bulwark | armour | +16 defense to all types | +5% effective HP |  |
| Hearth | armour | +8% max HP | +5% effective HP |  |
| Zephyr | armour | +16% stamina regeneration | — |  |
| Gilt | armour | +11% Glowen found | — |  |

## 4. Weapons, weapon skills and spells

Every weapon at item level 5, rare, +0, held by a knight whose points (10 in each damage stat, plus 45 shared by the weapon's grades in proportion to their weight) suit that weapon. Best grip (one- or two-handed). Skills: listed damage multipliers × the weapon's power, per second of cooldown (single target; utility skills show 0).

| Weapon | Grades | Grip | Burst DPS | Sustained DPS | Per swing | Stamina/swing | Skills (dmg per s of cooldown) | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Greathammer | S/- | 2H | 652 | 223 | 787 | 48.3 | Earthshaker 151, Meteor Lunge 122, Unstoppable 0 | ⚠ 1.52× median DPS; ⚠ skills 2.24× median |
| Greataxe | A/- | 2H | 600 | 195 | 587 | 41.4 | Cleave Spin 92, Execute 52, Bloodlust 0 |  |
| Colossal Sword | A/E | 2H | 587 | 192 | 599 | 43.1 | Guillotine 108, Stomp 40, Charged Swing 125 | ⚠ skills 2.24× median |
| Crossbow | B/- | 2H | 450 | 147 | 444 | 41.4 | Piercing Bolt 79, Explosive Bolt 48, Rapid Fire 88 |  |
| Club | E/- | 2H | 405 | 148 | 349 | 31.1 | Bonk 79, Wild Swing 38, Tantrum 0 |  |
| Twin Daggers | -/S | 1H | 314 | 105 | 105 | 13.8 | Shadow Step 51, Fan of Knives 13, Flurry 57 |  |
| Rapier | -/A | 1H | 362 | 129 | 184 | 19 | Lunge 51, Riposte Stance 0, Thousand Cuts 55 |  |
| Katana | D/A | 2H | 402 | 146 | 226 | 20.7 | Iai Slash 53, Crescent 32, Blood Moon 0 |  |
| Bow | -/B | 2H | 299 | 110 | 287 | 34.5 | Volley 79, Piercing Shot 40, Rain 15 |  |
| Whip | -/E | 1H | 326 | 137 | 233 | 20.7 | Lash 53, Crack 28, Serpent Coil 55 |  |
| Longsword | B/B | 2H | 426 | 151 | 288 | 25.9 | Shield Breaker 59, Spin Slash 33, Battle Cry 0 |  |
| Spear | C/B | 2H | 393 | 137 | 245 | 24.2 | Impale 59, Sweep 28, Phalanx 0 |  |
| Battleaxe | A/D | 2H | 563 | 190 | 430 | 31.1 | Cleave 83, Hook 37, Frenzy 0 |  |
| Mace | B/E | 2H | 479 | 176 | 416 | 31.1 | Holy Smite 74, Consecrate 40, Judgment 27 |  |
| Halberd | A/C | 2H | 500 | 180 | 401 | 29.3 | Moulinet 102, Hook Pull 35, Vault 44 |  |
| Twin Axes | C/B | 2H | 365 | 130 | 198 | 20.7 | Whirlwind 71, Throw 32, Rampage 0 |  |
| Hollow Maul | B/-/Br B | 2H | 387 | 132 | 407 | 41.4 | Singularity 57, Event Horizon 86, Null Shell 0 |  |
| Spellblade | -/B/Br B | 1H | 388 | 140 | 253 | 24.2 | Arc Wave 40, Blink Strike 36, Runic Edge 0 |  |
| Censer Flail | B/-/Pr B | 2H | 439 | 151 | 344 | 31.1 | Incense 61, Brimstone 52, Sanctified Flame 0 |  |
| Dawn Glaive | -/B/Pr B | 1H | 395 | 142 | 300 | 27.6 | Sunrise 54, Halo Throw 32, Judgement Ray 36 |  |

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
| NG+3 | 49,237 → L309 | 42,440 → L323 | 45,635 → L336 | 41,476 → L350 | 47,728 → L364 | 50,622 → L379 | 57,748 → L395 | 49,919 → L411 |
| NG+4 | 54,137 → L426 | 47,787 → L441 | 51,053 → L456 | 44,866 → L470 | 52,266 → L484 | 54,327 → L499 | 62,783 → L516 | 56,229 → L533 |
| NG+5 | 60,409 → L550 | 53,211 → L566 | 55,162 → L581 | 49,161 → L595 | 56,378 → L609 | 58,810 → L624 | 71,458 → L642 | 60,768 → L659 |
| NG+6 | 66,172 → L676 | 56,247 → L693 | 61,743 → L708 | 56,622 → L724 | 62,266 → L739 | 66,585 → L756 | 76,188 → L774 | 68,155 → L793 |
| NG+7 | 74,076 → L811 | 62,486 → L828 | 66,585 → L845 | 59,839 → L861 | 66,844 → L876 | 71,919 → L893 | 84,120 → L913 | 75,031 → L932 |
| NG+10 | 94,486 → L1250 | 80,546 → L1269 | 89,679 → L1287 | 80,277 → L1305 | 92,125 → L1323 | 94,603 → L1342 | 113,628 → L1364 | 98,547 → L1386 |

Reinforcement: each +1 is +20% (×4 at +15), against rarity steps of ×1.06–×1.28. Glowen per step:

| + | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 | +11 | +12 | +13 | +14 | +15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Glowen | 400 | 580 | 841 | 1,219 | 1,768 | 2,564 | 3,718 | 5,391 | 7,816 | 11,334 | 16,434 | 23,829 | 34,552 | 50,101 | 72,646 |
| Power | ×1.15 | ×1.3 | ×1.45 | ×1.6 | ×1.75 | ×1.9 | ×2.05 | ×2.2 | ×2.35 | ×2.5 | ×2.65 | ×2.8 | ×2.95 | ×3.1 | ×3.25 |

## 6. Growth: player against the world

How the quality build's damage and toughness grow against the zone's enemies (zone 1 of the first playthrough = 1.00). A healthy curve keeps both ratios near 1.

| Cycle | Zone | Level | DPS | Foe HP | TTK s | Max HP | Hit taken | Hits to die | Kill time × | Survival × | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First playthrough | 1 | L6 | 33 | 90 | 2.7 | 293 | 22 | 13.1 | 1 | 1 |  |
| First playthrough | 2 | L15 | 51 | 122 | 2.4 | 345 | 22 | 15.5 | 0.88 | 1.18 |  |
| First playthrough | 3 | L26 | 76 | 166 | 2.2 | 398 | 33 | 12.2 | 0.8 | 0.93 |  |
| First playthrough | 4 | L37 | 116 | 217 | 1.9 | 450 | 36 | 12.6 | 0.69 | 0.96 |  |
| First playthrough | 5 | L47 | 164 | 253 | 1.5 | 503 | 43 | 11.8 | 0.57 | 0.9 |  |
| First playthrough | 6 | L57 | 239 | 354 | 1.5 | 555 | 49 | 11.2 | 0.54 | 0.86 |  |
| First playthrough | 7 | L67 | 288 | 351 | 1.2 | 608 | 48 | 12.6 | 0.45 | 0.96 |  |
| First playthrough | 8 | L76 | 334 | 521 | 1.6 | 645 | 52 | 12.3 | 0.57 | 0.94 |  |
| NG+1 | 1 | L87 | 427 | 1,987 | 4.7 | 675 | 46 | 14.8 | 1.71 | 1.13 |  |
| NG+1 | 2 | L100 | 542 | 1,900 | 3.5 | 715 | 65 | 10.9 | 1.29 | 0.83 |  |
| NG+1 | 3 | L113 | 668 | 2,044 | 3.1 | 755 | 65 | 11.7 | 1.12 | 0.89 |  |
| NG+1 | 4 | L125 | 749 | 2,381 | 3.2 | 795 | 66 | 12 | 1.17 | 0.92 |  |
| NG+1 | 5 | L138 | 841 | 2,581 | 3.1 | 840 | 77 | 10.8 | 1.13 | 0.83 |  |
| NG+1 | 6 | L151 | 932 | 3,420 | 3.7 | 898 | 85 | 10.6 | 1.35 | 0.81 |  |
| NG+1 | 7 | L166 | 1,048 | 3,221 | 3.1 | 956 | 75 | 12.7 | 1.13 | 0.97 |  |
| NG+1 | 8 | L181 | 1,208 | 4,429 | 3.7 | 1,028 | 109 | 9.5 | 1.35 | 0.72 |  |
| NG+2 | 1 | L196 | 1,510 | 6,853 | 4.5 | 1,086 | 74 | 14.7 | 1.67 | 1.12 |  |
| NG+2 | 2 | L210 | 1,847 | 6,456 | 3.5 | 1,144 | 108 | 10.6 | 1.29 | 0.81 |  |
| NG+2 | 3 | L223 | 2,203 | 6,838 | 3.1 | 1,202 | 113 | 10.7 | 1.14 | 0.81 |  |
| NG+2 | 4 | L236 | 2,446 | 7,872 | 3.2 | 1,260 | 117 | 10.8 | 1.18 | 0.82 |  |
| NG+2 | 5 | L249 | 2,717 | 8,388 | 3.1 | 1,318 | 145 | 9.1 | 1.14 | 0.7 |  |
| NG+2 | 6 | L263 | 3,025 | 10,968 | 3.6 | 1,376 | 160 | 8.6 | 1.33 | 0.66 |  |
| NG+2 | 7 | L279 | 3,360 | 10,117 | 3 | 1,449 | 142 | 10.2 | 1.11 | 0.78 |  |
| NG+2 | 8 | L294 | 3,715 | 13,892 | 3.7 | 1,507 | 210 | 7.2 | 1.37 | 0.55 |  |
| NG+3 | 1 | L309 | 4,325 | 13,389 | 3.1 | 1,536 | 87 | 17.6 | 1.14 | 1.34 |  |
| NG+3 | 2 | L323 | 4,999 | 12,160 | 2.4 | 1,536 | 126 | 12.2 | 0.89 | 0.93 |  |
| NG+3 | 3 | L336 | 5,710 | 12,542 | 2.2 | 1,536 | 131 | 11.7 | 0.81 | 0.9 |  |
| NG+3 | 4 | L350 | 6,208 | 14,026 | 2.3 | 1,536 | 134 | 11.5 | 0.83 | 0.87 |  |
| NG+3 | 5 | L364 | 6,620 | 14,474 | 2.2 | 1,536 | 165 | 9.3 | 0.8 | 0.71 |  |
| NG+3 | 6 | L379 | 6,898 | 18,345 | 2.7 | 1,536 | 181 | 8.5 | 0.98 | 0.65 |  |
| NG+3 | 7 | L395 | 7,169 | 16,355 | 2.3 | 1,536 | 156 | 9.8 | 0.84 | 0.75 |  |
| NG+3 | 8 | L411 | 7,442 | 21,741 | 2.9 | 1,536 | 233 | 6.6 | 1.07 | 0.5 |  |
| NG+4 | 1 | L426 | 8,131 | 21,065 | 2.6 | 1,536 | 81 | 19.1 | 0.95 | 1.45 |  |
| NG+4 | 2 | L441 | 8,833 | 19,165 | 2.2 | 1,536 | 117 | 13.1 | 0.8 | 1 |  |
| NG+4 | 3 | L456 | 9,544 | 19,799 | 2.1 | 1,536 | 124 | 12.4 | 0.76 | 0.94 |  |
| NG+4 | 4 | L470 | 9,808 | 22,141 | 2.3 | 1,536 | 128 | 12 | 0.83 | 0.91 |  |
| NG+4 | 5 | L484 | 10,071 | 22,848 | 2.3 | 1,536 | 159 | 9.6 | 0.83 | 0.74 |  |
| NG+4 | 6 | L499 | 10,335 | 28,958 | 2.8 | 1,536 | 176 | 8.7 | 1.03 | 0.67 |  |
| NG+4 | 7 | L516 | 10,598 | 25,817 | 2.4 | 1,536 | 152 | 10.1 | 0.9 | 0.77 |  |
| NG+4 | 8 | L533 | 10,862 | 34,319 | 3.2 | 1,536 | 230 | 6.7 | 1.16 | 0.51 |  |
| NG+5 | 1 | L550 | 11,125 | 25,221 | 2.3 | 1,536 | 69 | 22.3 | 0.83 | 1.7 |  |
| NG+5 | 2 | L566 | 11,389 | 23,049 | 2 | 1,536 | 105 | 14.6 | 0.74 | 1.11 |  |
| NG+5 | 3 | L581 | 11,652 | 23,907 | 2.1 | 1,536 | 118 | 13 | 0.75 | 0.99 |  |
| NG+5 | 4 | L595 | 11,916 | 26,736 | 2.2 | 1,536 | 122 | 12.6 | 0.82 | 0.96 |  |
| NG+5 | 5 | L609 | 12,179 | 27,590 | 2.3 | 1,536 | 153 | 10.1 | 0.83 | 0.77 |  |
| NG+5 | 6 | L624 | 12,443 | 34,967 | 2.8 | 1,536 | 170 | 9.1 | 1.03 | 0.69 |  |
| NG+5 | 7 | L642 | 12,706 | 31,174 | 2.5 | 1,536 | 146 | 10.5 | 0.9 | 0.8 |  |
| NG+5 | 8 | L659 | 12,970 | 41,441 | 3.2 | 1,536 | 224 | 6.9 | 1.17 | 0.52 |  |
| NG+6 | 1 | L676 | 13,233 | 29,465 | 2.2 | 1,536 | 66 | 23.3 | 0.82 | 1.78 |  |
| NG+6 | 2 | L693 | 13,497 | 26,927 | 2 | 1,536 | 101 | 15.1 | 0.73 | 1.15 |  |
| NG+6 | 3 | L708 | 13,760 | 27,929 | 2 | 1,536 | 114 | 13.5 | 0.75 | 1.03 |  |
| NG+6 | 4 | L724 | 14,024 | 31,234 | 2.2 | 1,536 | 118 | 13 | 0.82 | 0.99 |  |
| NG+6 | 5 | L739 | 14,287 | 32,232 | 2.3 | 1,536 | 149 | 10.3 | 0.83 | 0.79 |  |
| NG+6 | 6 | L756 | 14,551 | 40,850 | 2.8 | 1,536 | 166 | 9.3 | 1.03 | 0.71 |  |
| NG+6 | 7 | L774 | 14,814 | 36,419 | 2.5 | 1,536 | 143 | 10.7 | 0.9 | 0.82 |  |
| NG+6 | 8 | L793 | 15,078 | 48,413 | 3.2 | 1,536 | 220 | 7 | 1.18 | 0.53 |  |
| NG+7 | 1 | L811 | 15,341 | 34,149 | 2.2 | 1,536 | 62 | 24.7 | 0.82 | 1.88 |  |
| NG+7 | 2 | L828 | 15,605 | 31,208 | 2 | 1,536 | 96 | 16 | 0.74 | 1.22 |  |
| NG+7 | 3 | L845 | 15,868 | 32,369 | 2 | 1,536 | 108 | 14.2 | 0.75 | 1.09 |  |
| NG+7 | 4 | L861 | 16,132 | 36,200 | 2.2 | 1,536 | 112 | 13.7 | 0.83 | 1.04 |  |
| NG+7 | 5 | L876 | 16,395 | 37,356 | 2.3 | 1,536 | 142 | 10.8 | 0.84 | 0.83 |  |
| NG+7 | 6 | L893 | 16,659 | 47,345 | 2.8 | 1,536 | 158 | 9.7 | 1.04 | 0.74 |  |
| NG+7 | 7 | L913 | 16,922 | 42,209 | 2.5 | 1,536 | 137 | 11.2 | 0.92 | 0.86 |  |
| NG+7 | 8 | L932 | 17,186 | 56,110 | 3.3 | 1,536 | 211 | 7.3 | 1.2 | 0.56 |  |
| NG+10 | 1 | L1250 | 21,665 | 56,365 | 2.6 | 1,536 | 154 | 10 | 0.96 | 0.76 |  |
| NG+10 | 2 | L1269 | 21,928 | 51,511 | 2.3 | 1,536 | 238 | 6.5 | 0.86 | 0.49 | ⚠ survives 2× fewer hits |
| NG+10 | 3 | L1287 | 22,192 | 53,428 | 2.4 | 1,536 | 269 | 5.7 | 0.89 | 0.44 | ⚠ survives 2.3× fewer hits |
| NG+10 | 4 | L1305 | 22,455 | 59,750 | 2.7 | 1,536 | 282 | 5.5 | 0.98 | 0.42 | ⚠ survives 2.4× fewer hits |
| NG+10 | 5 | L1323 | 22,719 | 61,658 | 2.7 | 1,536 | 357 | 4.3 | 1 | 0.33 | ⚠ survives 3× fewer hits |
| NG+10 | 6 | L1342 | 22,982 | 78,146 | 3.4 | 1,536 | 400 | 3.8 | 1.25 | 0.29 | ⚠ survives 3.4× fewer hits |
| NG+10 | 7 | L1364 | 23,246 | 69,669 | 3 | 1,536 | 347 | 4.4 | 1.1 | 0.34 | ⚠ survives 3× fewer hits |
| NG+10 | 8 | L1386 | 23,509 | 92,613 | 3.9 | 1,536 | 540 | 2.8 | 1.45 | 0.22 | ⚠ survives 4.6× fewer hits |

