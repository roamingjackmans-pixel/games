# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 3,652 void) kills the Bonk: greathammer (2H) build (980 HP) in one hit (0.98). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
2. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 3,652 void) kills the Slicey: twin daggers build (819 HP) in one hit (0.82). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
3. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 3,652 void) kills the Bow (Slicey) build (808 HP) in one hit (0.81). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
4. **Boss length** (severity 5.8): NG+10 zone 8: the median build needs 826 s of nonstop hitting to kill The Landlord (11,525,707 HP), 13.8 minutes before any dodging (target 11 min, D301). *Suggested:* Trim its NG_BOSS_HP factor (D301), the boss HP multiplier for this cycle, or the extra phase bars.
5. **Gems** (severity 4.8): Quicksilver raises sustained DPS by +2% (burst +7%) where Brutal gives +6% (0.38× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
6. **Build spread** (severity 4.8): NG+4 zone 2: the slowest build (Prayer caster: talisman spells) takes 853 s on the boss, 3.5× the fastest (Bonk: greathammer (2H), 240 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
7. **Build spread** (severity 4.8): NG+4 zone 3: the slowest build (Prayer caster: talisman spells) takes 870 s on the boss, 3.5× the fastest (Bonk: greathammer (2H), 245 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
8. **Build spread** (severity 4.8): NG+4 zone 1: the slowest build (Prayer caster: talisman spells) takes 835 s on the boss, 3.5× the fastest (Bonk: greathammer (2H), 236 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
9. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
10. **Weapon skills** (severity 4.1): Colossal Sword's skills deal 273 damage per second of cooldown, 2.04× the median weapon's (134). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
11. **Weapon skills** (severity 4.1): Greathammer's skills deal 273 damage per second of cooldown, 2.04× the median weapon's (134). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
12. **Enemy curve** (severity 3.8): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 108. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
13. **Spells** (severity 3.5): Arcane Beam (brain): 16.4 damage per busy second at Spell Skill 100, 2.05× the brain median (8). *Suggested:* Lengthen its cooldown or lower its base.
14. **Weapons** (severity 3.4): Greathammer: 205 sustained light-attack DPS, 1.39× the median weapon (147) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
15. **Enemy curve** (severity 3.2): NG+10: zone 7 room enemies have 69,669 HP on average, below zone 6's 78,146. *Suggested:* Check the zone roster mix and the HP curve.
16. **Enemy curve** (severity 3.2): NG+3: zone 7 room enemies have 16,355 HP on average, below zone 6's 18,345. *Suggested:* Check the zone roster mix and the HP curve.
17. **Enemy curve** (severity 3.2): NG+7: zone 7 room enemies have 42,209 HP on average, below zone 6's 47,345. *Suggested:* Check the zone roster mix and the HP curve.
18. **Gear power** (severity 3): Reinforcement reaches ×3.25 at +15, while the whole rarity ladder is ×1.28: a +15 common out-hits a +0 legendary 2.5×, so drops matter little once reinforcement starts. *Suggested:* Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.

(120 more findings of the same kinds are in the tables below.)

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
| Bonk: greathammer (2H) | 780 dps · 2.5s / 155s · 18.2 / 2 hits | 1,064 dps · 1.8s / 153s · 15.2 / 2.1 hits | 1,373 dps · 1.5s / 147s · 17.8 / 3 hits | 1,597 dps · 1.5s / 147s · 15.9 / 2.4 hits | 1,845 dps · 1.4s / 148s · 13.5 / 1.4 hits | 2,113 dps · 1.6s / 149s · 15.1 / 1.7 hits | 2,485 dps · 1.3s / 147s · 17.6 / 2 hits | 2,710 dps · 1.6s / 237s · 14 / 1 hits ⚠1-shot |
| Slicey: twin daggers | 368 dps · 5.4s / 329s · 15.3 / 1.7 hits | 503 dps · 3.8s / 324s · 12.8 / 1.7 hits | 664 dps · 3.1s / 303s · 15 / 2.5 hits | 789 dps · 3s / 297s · 13.4 / 2 hits | 933 dps · 2.8s / 292s · 11.3 / 1.2 hits | 1,086 dps · 3.1s / 290s · 12.5 / 1.4 hits | 1,285 dps · 2.5s / 285s · 14.7 / 1.7 hits | 1,407 dps · 3.1s / 456s · 11.7 / 0.8 hits ⚠1-shot |
| Quality: longsword + shield | 428 dps · 4.6s / 283s · 18.9 / 2.1 hits | 543 dps · 3.5s / 300s · 15.9 / 2.2 hits | 670 dps · 3s / 300s · 18.6 / 3.1 hits | 751 dps · 3.2s / 312s · 16.6 / 2.5 hits | 844 dps · 3.1s / 323s · 14.1 / 1.5 hits | 935 dps · 3.7s / 337s · 15.8 / 1.8 hits | 1,052 dps · 3.1s / 348s · 18.4 / 2.1 hits | 1,212 dps · 3.7s / 530s · 14.7 / 1 hits |
| Bow (Slicey) | 371 dps · 5.4s / 327s · 15 / 1.7 hits | 498 dps · 3.8s / 327s · 12.6 / 1.7 hits | 645 dps · 3.2s / 312s · 14.8 / 2.5 hits | 758 dps · 3.1s / 310s · 13.2 / 2 hits | 894 dps · 2.9s / 305s · 11.1 / 1.2 hits | 1,032 dps · 3.3s / 305s · 12.3 / 1.4 hits | 1,204 dps · 2.7s / 304s · 14.5 / 1.7 hits | 1,341 dps · 3.3s / 479s · 11.5 / 0.8 hits ⚠1-shot |
| Crossbow (Bonk) | 378 dps · 5.3s / 320s · 18.2 / 2 hits | 506 dps · 3.8s / 322s · 15.2 / 2.1 hits | 667 dps · 3.1s / 302s · 17.8 / 3 hits | 782 dps · 3s / 300s · 15.9 / 2.4 hits | 910 dps · 2.8s / 300s · 13.5 / 1.4 hits | 1,049 dps · 3.3s / 300s · 15.1 / 1.7 hits | 1,222 dps · 2.6s / 300s · 17.6 / 2 hits | 1,335 dps · 3.3s / 481s · 14 / 1 hits ⚠1-shot |
| Brain caster: staff spells | 487 dps · 4.1s / 249s · 15 / 1.7 hits | 628 dps · 3s / 259s · 12.6 / 1.7 hits | 795 dps · 2.6s / 253s · 14.8 / 2.5 hits | 908 dps · 2.6s / 258s · 13.2 / 2 hits | 1,036 dps · 2.5s / 263s · 11.1 / 1.2 hits | 1,174 dps · 2.9s / 268s · 12.3 / 1.4 hits | 1,260 dps · 2.6s / 291s · 14.9 / 1.7 hits | 1,336 dps · 3.3s / 481s · 11.5 / 0.8 hits ⚠1-shot |
| Prayer caster: talisman spells | 265 dps · 7.5s / 456s · 15.3 / 1.7 hits | 350 dps · 5.4s / 466s · 12.8 / 1.7 hits | 451 dps · 4.5s / 446s · 15 / 2.5 hits | 523 dps · 4.6s / 449s · 13.4 / 2 hits | 609 dps · 4.2s / 447s · 11.3 / 1.2 hits | 700 dps · 4.9s / 450s · 12.5 / 1.4 hits | 762 dps · 4.2s / 481s · 15.1 / 1.7 hits | 815 dps · 5.4s / 788s · 11.7 / 0.8 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 465 + weapon 22 · Z2 Meteor, Void Rift, Arcane Beam; spells 601 + weapon 28 · Z3 Meteor, Void Rift, Arcane Beam; spells 761 + weapon 34 · Z4 Meteor, Void Rift, Arcane Beam; spells 870 + weapon 38 · Z5 Meteor, Void Rift, Arcane Beam; spells 995 + weapon 42 · Z6 Meteor, Void Rift, Arcane Beam; spells 1,128 + weapon 46 · Z7 Meteor, Void Rift, Arcane Beam; spells 1,209 + weapon 50 · Z8 Meteor, Void Rift, Arcane Beam; spells 1,281 + weapon 55
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 150 + weapon 116 · Z2 Sunray, Purify; spells 196 + weapon 153 · Z3 Sunray, Purify; spells 252 + weapon 199 · Z4 Sunray, Purify; spells 291 + weapon 232 · Z5 Sunray, Purify; spells 336 + weapon 273 · Z6 Sunray, Purify; spells 384 + weapon 315 · Z7 Sunray, Purify; spells 416 + weapon 346 · Z8 Sunray, Purify; spells 441 + weapon 374

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 320 | 155 | 456 | 2.9 |
| 2 | 322 | 153 | 466 | 3 |
| 3 | 302 | 147 | 446 | 3 |
| 4 | 300 | 147 | 449 | 3.1 |
| 5 | 300 | 148 | 447 | 3 |
| 6 | 300 | 149 | 450 | 3 |
| 7 | 300 | 147 | 481 | 3.3 |
| 8 | 481 | 237 | 788 | 3.3 |

### NG+2

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 3,123 dps · 2.2s / 238s · 18.3 / 2.1 hits | 3,557 dps · 1.8s / 239s · 15 / 2.1 hits | 4,034 dps · 1.7s / 239s · 16.5 / 2.8 hits | 4,271 dps · 1.8s / 239s · 14.2 / 2.2 hits | 4,499 dps · 1.9s / 239s · 11.3 / 1.2 hits | 4,742 dps · 2.3s / 239s · 12.2 / 1.4 hits | 4,987 dps · 2s / 239s · 14.3 / 1.6 hits | 5,264 dps · 2.6s / 328s · 10.6 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 1,627 dps · 4.2s / 456s · 15.3 / 1.7 hits | 1,854 dps · 3.5s / 459s · 12.6 / 1.7 hits | 2,103 dps · 3.3s / 459s · 13.9 / 2.3 hits | 2,232 dps · 3.5s / 457s · 12 / 1.8 hits | 2,352 dps · 3.6s / 456s · 9.5 / 1 hits | 2,485 dps · 4.4s / 456s · 10.3 / 1.2 hits | 2,614 dps · 3.9s / 456s · 12.1 / 1.4 hits | 2,745 dps · 5.1s / 630s · 9.1 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 1,517 dps · 4.5s / 489s · 18.9 / 2.1 hits | 1,855 dps · 3.5s / 458s · 15.4 / 2.1 hits | 2,212 dps · 3.1s / 437s · 17.2 / 2.9 hits | 2,458 dps · 3.2s / 415s · 14.9 / 2.3 hits | 2,730 dps · 3.1s / 393s · 11.8 / 1.2 hits | 3,040 dps · 3.6s / 372s · 12.8 / 1.5 hits | 3,377 dps · 3s / 353s · 15 / 1.7 hits | 3,734 dps · 3.7s / 463s · 11.2 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 1,544 dps · 4.4s / 480s · 15.1 / 1.7 hits | 1,758 dps · 3.7s / 484s · 12.5 / 1.7 hits | 2,011 dps · 3.4s / 480s · 13.7 / 2.3 hits | 2,129 dps · 3.7s / 479s · 11.8 / 1.8 hits | 2,242 dps · 3.7s / 479s · 9.4 / 1 hits ⚠1-shot | 2,362 dps · 4.6s / 479s · 10.2 / 1.2 hits | 2,483 dps · 4.1s / 481s · 11.9 / 1.4 hits | 2,606 dps · 5.3s / 663s · 9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 1,557 dps · 4.4s / 477s · 18.3 / 2.1 hits | 1,773 dps · 3.6s / 480s · 15 / 2.1 hits | 2,010 dps · 3.4s / 480s · 16.5 / 2.8 hits | 2,129 dps · 3.7s / 479s · 14.2 / 2.2 hits | 2,242 dps · 3.7s / 479s · 11.3 / 1.2 hits | 2,363 dps · 4.6s / 479s · 12.2 / 1.4 hits | 2,485 dps · 4.1s / 480s · 14.3 / 1.6 hits | 2,622 dps · 5.3s / 659s · 10.6 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 1,524 dps · 4.5s / 487s · 15.1 / 1.7 hits | 1,724 dps · 3.7s / 493s · 12.5 / 1.7 hits | 1,936 dps · 3.5s / 499s · 13.7 / 2.3 hits | 2,031 dps · 3.9s / 502s · 11.8 / 1.8 hits | 2,126 dps · 3.9s / 505s · 9.4 / 1 hits ⚠1-shot | 2,221 dps · 4.9s / 510s · 10.2 / 1.2 hits | 2,317 dps · 4.4s / 515s · 12.1 / 1.4 hits | 2,413 dps · 5.8s / 717s · 9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 934 dps · 7.3s / 794s · 15.3 / 1.7 hits | 1,061 dps · 6.1s / 801s · 12.6 / 1.7 hits | 1,202 dps · 5.7s / 804s · 13.9 / 2.3 hits | 1,267 dps · 6.2s / 805s · 12 / 1.8 hits | 1,332 dps · 6.3s / 806s · 9.5 / 1 hits | 1,397 dps · 7.8s / 810s · 10.3 / 1.2 hits | 1,463 dps · 6.9s / 815s · 12.2 / 1.4 hits | 1,530 dps · 9.1s / 1,130s · 9.1 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 1,459 + weapon 64 · Z2 Meteor, Void Rift, Arcane Beam; spells 1,649 + weapon 75 · Z3 Meteor, Void Rift, Arcane Beam; spells 1,850 + weapon 86 · Z4 Meteor, Void Rift, Arcane Beam; spells 1,939 + weapon 92 · Z5 Meteor, Void Rift, Arcane Beam; spells 2,028 + weapon 98 · Z6 Meteor, Void Rift, Arcane Beam; spells 2,117 + weapon 105 · Z7 Meteor, Void Rift, Arcane Beam; spells 2,206 + weapon 112 · Z8 Meteor, Void Rift, Arcane Beam; spells 2,294 + weapon 118
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 503 + weapon 431 · Z2 Sunray, Purify; spells 568 + weapon 493 · Z3 Sunray, Purify; spells 637 + weapon 565 · Z4 Sunray, Purify; spells 668 + weapon 599 · Z5 Sunray, Purify; spells 698 + weapon 633 · Z6 Sunray, Purify; spells 729 + weapon 668 · Z7 Sunray, Purify; spells 760 + weapon 704 · Z8 Sunray, Purify; spells 790 + weapon 740

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 480 | 238 | 794 | 3.3 |
| 2 | 480 | 239 | 801 | 3.4 |
| 3 | 480 | 239 | 804 | 3.4 |
| 4 | 479 | 239 | 805 | 3.4 |
| 5 | 479 | 239 | 806 | 3.4 |
| 6 | 479 | 239 | 810 | 3.4 |
| 7 | 480 | 239 | 815 | 3.4 |
| 8 | 659 | 328 | 1,130 | 3.4 |

### NG+3

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 5,918 dps · 2.3s / 245s · 21.1 / 2.4 hits | 6,564 dps · 1.9s / 244s · 16.4 / 2.3 hits | 7,246 dps · 1.7s / 245s · 17.6 / 2.9 hits | 7,559 dps · 1.9s / 240s · 14.6 / 2.2 hits | 7,876 dps · 1.8s / 235s · 11.1 / 1.2 hits | 8,176 dps · 2.2s / 232s · 11.7 / 1.3 hits | 8,498 dps · 1.9s / 227s · 13.4 / 1.5 hits | 8,823 dps · 2.5s / 307s · 9.5 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 3,070 dps · 4.4s / 472s · 18.5 / 2.1 hits | 3,405 dps · 3.6s / 470s · 14.4 / 2 hits | 3,767 dps · 3.3s / 470s · 15.4 / 2.6 hits | 3,930 dps · 3.6s / 463s · 12.8 / 2 hits | 4,095 dps · 3.5s / 452s · 9.8 / 1 hits | 4,251 dps · 4.3s / 445s · 10.3 / 1.2 hits | 4,419 dps · 3.7s / 437s · 11.8 / 1.4 hits | 4,597 dps · 4.7s / 589s · 8.4 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 4,348 dps · 3.1s / 333s · 22.8 / 2.6 hits | 5,026 dps · 2.4s / 319s · 17.8 / 2.4 hits | 5,742 dps · 2.2s / 309s · 19 / 3.2 hits | 6,243 dps · 2.2s / 291s · 15.8 / 2.4 hits | 6,659 dps · 2.2s / 278s · 12 / 1.3 hits | 6,940 dps · 2.6s / 273s · 12.7 / 1.4 hits | 7,214 dps · 2.3s / 267s · 14.5 / 1.7 hits | 7,490 dps · 2.9s / 361s · 10.3 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 2,912 dps · 4.6s / 498s · 18.5 / 2.1 hits | 3,250 dps · 3.7s / 493s · 14.4 / 2 hits | 3,586 dps · 3.5s / 494s · 15.4 / 2.6 hits | 3,740 dps · 3.8s / 486s · 12.8 / 2 hits | 3,895 dps · 3.7s / 475s · 9.8 / 1 hits | 4,042 dps · 4.5s / 468s · 10.3 / 1.2 hits | 4,200 dps · 3.9s / 459s · 11.8 / 1.4 hits | 4,359 dps · 5s / 621s · 8.4 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 2,916 dps · 4.6s / 497s · 21.1 / 2.4 hits | 3,233 dps · 3.8s / 495s · 16.4 / 2.3 hits | 3,568 dps · 3.5s / 497s · 17.6 / 2.9 hits | 3,755 dps · 3.7s / 484s · 14.6 / 2.2 hits | 3,912 dps · 3.7s / 473s · 11.1 / 1.2 hits | 4,061 dps · 4.5s / 466s · 11.7 / 1.3 hits | 4,220 dps · 3.9s / 457s · 13.4 / 1.5 hits | 4,382 dps · 5s / 618s · 9.5 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 2,671 dps · 5s / 543s · 18.5 / 2.1 hits | 2,939 dps · 4.1s / 545s · 14.4 / 2 hits | 3,220 dps · 3.9s / 550s · 15.4 / 2.6 hits | 3,336 dps · 4.2s / 545s · 12.8 / 2 hits | 3,451 dps · 4.2s / 537s · 9.8 / 1 hits | 3,566 dps · 5.1s / 531s · 10.3 / 1.2 hits | 3,681 dps · 4.4s / 524s · 11.8 / 1.4 hits | 3,796 dps · 5.7s / 713s · 8.4 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 1,712 dps · 7.8s / 847s · 18.5 / 2.1 hits | 1,891 dps · 6.4s / 847s · 14.4 / 2 hits | 2,080 dps · 6s / 852s · 15.4 / 2.6 hits | 2,167 dps · 6.5s / 839s · 12.8 / 2 hits | 2,250 dps · 6.4s / 823s · 9.8 / 1 hits | 2,333 dps · 7.9s / 812s · 10.3 / 1.2 hits | 2,417 dps · 6.8s / 798s · 11.8 / 1.4 hits | 2,501 dps · 8.7s / 1,082s · 8.4 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 2,535 + weapon 136 · Z2 Meteor, Void Rift, Arcane Beam; spells 2,787 + weapon 152 · Z3 Meteor, Void Rift, Arcane Beam; spells 3,051 + weapon 170 · Z4 Meteor, Void Rift, Arcane Beam; spells 3,156 + weapon 180 · Z5 Meteor, Void Rift, Arcane Beam; spells 3,262 + weapon 189 · Z6 Meteor, Void Rift, Arcane Beam; spells 3,368 + weapon 198 · Z7 Meteor, Void Rift, Arcane Beam; spells 3,473 + weapon 207 · Z8 Meteor, Void Rift, Arcane Beam; spells 3,579 + weapon 217
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 873 + weapon 839 · Z2 Sunray, Purify; spells 960 + weapon 931 · Z3 Sunray, Purify; spells 1,051 + weapon 1,029 · Z4 Sunray, Purify; spells 1,087 + weapon 1,080 · Z5 Sunray, Purify; spells 1,123 + weapon 1,126 · Z6 Sunray, Purify; spells 1,160 + weapon 1,173 · Z7 Sunray, Purify; spells 1,196 + weapon 1,220 · Z8 Sunray, Purify; spells 1,233 + weapon 1,268

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 497 | 245 | 847 | 3.5 |
| 2 | 493 | 244 | 847 | 3.5 |
| 3 | 494 | 245 | 852 | 3.5 |
| 4 | 484 | 240 | 839 | 3.5 |
| 5 | 473 | 235 | 823 | 3.5 |
| 6 | 466 | 232 | 812 | 3.5 |
| 7 | 457 | 227 | 798 | 3.5 |
| 8 | 618 | 307 | 1,082 | 3.5 |

### NG+4

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 9,663 dps · 2.2s / 236s · 22.8 / 2.6 hits | 10,498 dps · 1.8s / 240s · 17.6 / 2.4 hits | 11,394 dps · 1.7s / 245s · 18.5 / 3.1 hits | 11,708 dps · 1.9s / 245s · 15.3 / 2.3 hits | 12,023 dps · 1.9s / 243s · 11.5 / 1.2 hits | 12,337 dps · 2.3s / 242s · 12.1 / 1.4 hits | 12,652 dps · 2s / 241s · 13.8 / 1.6 hits | 12,966 dps · 2.6s / 329s · 9.7 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 5,035 dps · 4.2s / 453s · 20.1 / 2.3 hits | 5,470 dps · 3.5s / 461s · 15.5 / 2.1 hits | 5,897 dps · 3.4s / 474s · 16.3 / 2.7 hits | 6,060 dps · 3.7s / 473s · 13.4 / 2.1 hits | 6,223 dps · 3.7s / 470s · 10.1 / 1.1 hits | 6,386 dps · 4.5s / 468s · 10.6 / 1.2 hits | 6,548 dps · 3.9s / 465s · 12.1 / 1.4 hits | 6,711 dps · 5.1s / 636s · 8.5 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 8,184 dps · 2.6s / 279s · 24.7 / 2.8 hits | 8,891 dps · 2.2s / 284s · 19 / 2.6 hits | 9,607 dps · 2.1s / 291s · 20 / 3.4 hits | 9,872 dps · 2.2s / 291s · 16.5 / 2.5 hits | 10,138 dps · 2.3s / 288s · 12.5 / 1.3 hits | 10,403 dps · 2.8s / 287s · 13 / 1.5 hits | 10,668 dps · 2.4s / 285s · 14.9 / 1.7 hits | 10,933 dps · 3.1s / 391s · 10.5 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 4,771 dps · 4.4s / 478s · 20.1 / 2.3 hits | 5,182 dps · 3.7s / 487s · 15.5 / 2.1 hits | 5,633 dps · 3.5s / 496s · 16.3 / 2.7 hits | 5,824 dps · 3.8s / 493s · 13.4 / 2.1 hits | 5,980 dps · 3.8s / 489s · 10.1 / 1.1 hits | 6,137 dps · 4.7s / 487s · 10.6 / 1.2 hits | 6,293 dps · 4.1s / 484s · 12.1 / 1.4 hits | 6,450 dps · 5.3s / 662s · 8.5 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 4,798 dps · 4.4s / 475s · 22.8 / 2.6 hits | 5,212 dps · 3.7s / 484s · 17.6 / 2.4 hits | 5,656 dps · 3.5s / 494s · 18.5 / 3.1 hits | 5,813 dps · 3.8s / 494s · 15.3 / 2.3 hits | 5,969 dps · 3.8s / 490s · 11.5 / 1.2 hits | 6,125 dps · 4.7s / 488s · 12.1 / 1.4 hits | 6,281 dps · 4.1s / 485s · 13.8 / 1.6 hits | 6,437 dps · 5.3s / 663s · 9.7 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 4,123 dps · 5.1s / 553s · 20.1 / 2.3 hits | 4,459 dps · 4.3s / 566s · 15.5 / 2.1 hits | 4,811 dps · 4.1s / 581s · 16.3 / 2.7 hits | 4,948 dps · 4.5s / 580s · 13.4 / 2.1 hits | 5,083 dps · 4.5s / 575s · 10.1 / 1.1 hits | 5,217 dps · 5.6s / 573s · 10.6 / 1.2 hits | 5,353 dps · 4.8s / 569s · 12.1 / 1.4 hits | 5,490 dps · 6.3s / 778s · 8.5 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 2,730 dps · 7.7s / 835s · 20.1 / 2.3 hits | 2,958 dps · 6.5s / 853s · 15.5 / 2.1 hits | 3,215 dps · 6.2s / 870s · 16.3 / 2.7 hits | 3,322 dps · 6.7s / 864s · 13.4 / 2.1 hits | 3,424 dps · 6.7s / 854s · 10.1 / 1.1 hits | 3,525 dps · 8.2s / 848s · 10.6 / 1.2 hits | 3,628 dps · 7.1s / 839s · 12.1 / 1.4 hits | 3,738 dps · 9.2s / 1,143s · 8.5 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 3,882 + weapon 240 · Z2 Meteor, Void Rift, Arcane Beam; spells 4,197 + weapon 262 · Z3 Meteor, Void Rift, Arcane Beam; spells 4,523 + weapon 289 · Z4 Meteor, Void Rift, Arcane Beam; spells 4,645 + weapon 303 · Z5 Meteor, Void Rift, Arcane Beam; spells 4,768 + weapon 315 · Z6 Meteor, Void Rift, Arcane Beam; spells 4,891 + weapon 327 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,014 + weapon 339 · Z8 Meteor, Void Rift, Arcane Beam; spells 5,136 + weapon 354
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,337 + weapon 1,393 · Z2 Sunray, Purify; spells 1,445 + weapon 1,512 · Z3 Sunray, Purify; spells 1,558 + weapon 1,658 · Z4 Sunray, Purify; spells 1,600 + weapon 1,722 · Z5 Sunray, Purify; spells 1,642 + weapon 1,781 · Z6 Sunray, Purify; spells 1,684 + weapon 1,841 · Z7 Sunray, Purify; spells 1,727 + weapon 1,901 · Z8 Sunray, Purify; spells 1,769 + weapon 1,969

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 475 | 236 | 835 | 3.5 |
| 2 | 484 | 240 | 853 | 3.5 |
| 3 | 494 | 245 | 870 | 3.5 |
| 4 | 493 | 245 | 864 | 3.5 |
| 5 | 489 | 243 | 854 | 3.5 |
| 6 | 487 | 242 | 848 | 3.5 |
| 7 | 484 | 241 | 839 | 3.5 |
| 8 | 662 | 329 | 1,143 | 3.5 |

### NG+5

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 13,281 dps · 1.9s / 206s · 26.8 / 3.1 hits | 13,595 dps · 1.7s / 223s · 19.6 / 2.7 hits | 13,910 dps · 1.7s / 243s · 19.5 / 3.3 hits | 14,224 dps · 1.9s / 244s · 16 / 2.5 hits | 14,539 dps · 1.9s / 243s · 12 / 1.3 hits | 14,854 dps · 2.4s / 243s · 12.5 / 1.4 hits | 15,168 dps · 2.1s / 242s · 14.3 / 1.7 hits | 15,483 dps · 2.7s / 333s · 10 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 6,874 dps · 3.7s / 397s · 23.5 / 2.7 hits | 7,037 dps · 3.3s / 431s · 17.2 / 2.4 hits | 7,200 dps · 3.3s / 469s · 17.2 / 2.9 hits | 7,362 dps · 3.6s / 471s · 14.1 / 2.2 hits | 7,525 dps · 3.7s / 469s · 10.5 / 1.1 hits | 7,688 dps · 4.5s / 469s · 11 / 1.2 hits | 7,851 dps · 4s / 468s · 12.6 / 1.5 hits | 8,014 dps · 5.2s / 644s · 8.7 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 11,198 dps · 2.3s / 244s · 29 / 3.3 hits | 11,464 dps · 2s / 265s · 21.2 / 2.9 hits | 11,729 dps · 2s / 288s · 21.1 / 3.5 hits | 11,994 dps · 2.2s / 289s · 17.3 / 2.7 hits | 12,259 dps · 2.3s / 288s · 13 / 1.4 hits | 12,525 dps · 2.8s / 288s · 13.5 / 1.5 hits | 12,790 dps · 2.4s / 287s · 15.4 / 1.8 hits | 13,055 dps · 3.2s / 395s · 10.8 / 0.7 hits ⚠1-shot |
| Bow (Slicey) | 6,606 dps · 3.8s / 413s · 23.5 / 2.7 hits | 6,763 dps · 3.4s / 449s · 17.2 / 2.4 hits | 6,919 dps · 3.5s / 488s · 17.2 / 2.9 hits | 7,076 dps · 3.8s / 490s · 14.1 / 2.2 hits | 7,232 dps · 3.8s / 488s · 10.5 / 1.1 hits | 7,389 dps · 4.7s / 488s · 11 / 1.2 hits | 7,545 dps · 4.1s / 487s · 12.6 / 1.5 hits | 7,701 dps · 5.4s / 670s · 8.7 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 6,593 dps · 3.8s / 414s · 26.8 / 3.1 hits | 6,750 dps · 3.4s / 450s · 19.6 / 2.7 hits | 6,906 dps · 3.5s / 489s · 19.5 / 3.3 hits | 7,062 dps · 3.8s / 491s · 16 / 2.5 hits | 7,218 dps · 3.8s / 489s · 12 / 1.3 hits | 7,374 dps · 4.7s / 489s · 12.5 / 1.4 hits | 7,530 dps · 4.1s / 488s · 14.3 / 1.7 hits | 7,687 dps · 5.4s / 671s · 10 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 5,627 dps · 4.5s / 485s · 23.5 / 2.7 hits | 5,763 dps · 4s / 527s · 17.2 / 2.4 hits | 5,896 dps · 4.1s / 573s · 17.2 / 2.9 hits | 6,035 dps · 4.4s / 574s · 14.1 / 2.2 hits | 6,172 dps · 4.5s / 572s · 10.5 / 1.1 hits | 6,304 dps · 5.5s / 573s · 11 / 1.2 hits | 6,436 dps · 4.8s / 571s · 12.6 / 1.5 hits | 6,567 dps · 6.3s / 785s · 8.7 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 3,848 dps · 6.6s / 709s · 23.5 / 2.7 hits | 3,952 dps · 5.8s / 768s · 17.2 / 2.4 hits | 4,050 dps · 5.9s / 834s · 17.2 / 2.9 hits | 4,162 dps · 6.4s / 832s · 14.1 / 2.2 hits | 4,261 dps · 6.5s / 828s · 10.5 / 1.1 hits | 4,352 dps · 8s / 829s · 11 / 1.2 hits | 4,444 dps · 7s / 827s · 12.6 / 1.5 hits | 4,536 dps · 9.1s / 1,137s · 8.7 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 5,259 + weapon 368 · Z2 Meteor, Void Rift, Arcane Beam; spells 5,382 + weapon 381 · Z3 Meteor, Void Rift, Arcane Beam; spells 5,504 + weapon 392 · Z4 Meteor, Void Rift, Arcane Beam; spells 5,627 + weapon 407 · Z5 Meteor, Void Rift, Arcane Beam; spells 5,750 + weapon 422 · Z6 Meteor, Void Rift, Arcane Beam; spells 5,872 + weapon 431 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,995 + weapon 440 · Z8 Meteor, Void Rift, Arcane Beam; spells 6,118 + weapon 450
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,811 + weapon 2,037 · Z2 Sunray, Purify; spells 1,853 + weapon 2,099 · Z3 Sunray, Purify; spells 1,896 + weapon 2,154 · Z4 Sunray, Purify; spells 1,938 + weapon 2,224 · Z5 Sunray, Purify; spells 1,980 + weapon 2,281 · Z6 Sunray, Purify; spells 2,022 + weapon 2,330 · Z7 Sunray, Purify; spells 2,065 + weapon 2,379 · Z8 Sunray, Purify; spells 2,107 + weapon 2,429

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 413 | 206 | 709 | 3.5 |
| 2 | 449 | 223 | 768 | 3.4 |
| 3 | 488 | 243 | 834 | 3.4 |
| 4 | 490 | 244 | 832 | 3.4 |
| 5 | 488 | 243 | 828 | 3.4 |
| 6 | 488 | 243 | 829 | 3.4 |
| 7 | 487 | 242 | 827 | 3.4 |
| 8 | 670 | 333 | 1,137 | 3.4 |

### NG+6

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 15,797 dps · 1.9s / 202s · 27.9 / 3.2 hits | 16,112 dps · 1.7s / 220s · 20.3 / 2.8 hits | 16,426 dps · 1.7s / 240s · 20.2 / 3.4 hits | 16,741 dps · 1.9s / 242s · 16.5 / 2.5 hits | 17,055 dps · 1.9s / 242s · 12.3 / 1.3 hits | 17,370 dps · 2.4s / 243s · 12.8 / 1.5 hits | 17,684 dps · 2.1s / 243s · 14.6 / 1.7 hits | 17,999 dps · 2.7s / 335s · 10.1 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 8,176 dps · 3.6s / 390s · 24.5 / 2.8 hits | 8,339 dps · 3.2s / 425s · 17.9 / 2.5 hits | 8,502 dps · 3.3s / 464s · 17.8 / 3 hits | 8,665 dps · 3.6s / 467s · 14.5 / 2.2 hits | 8,828 dps · 3.7s / 467s · 10.8 / 1.1 hits | 8,990 dps · 4.5s / 469s · 11.3 / 1.3 hits | 9,153 dps · 4s / 469s · 12.8 / 1.5 hits | 9,316 dps · 5.2s / 647s · 8.9 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 13,320 dps · 2.2s / 239s · 30.2 / 3.4 hits | 13,585 dps · 2s / 261s · 22 / 3 hits | 13,851 dps · 2s / 285s · 21.9 / 3.7 hits | 14,116 dps · 2.2s / 287s · 17.9 / 2.8 hits | 14,381 dps · 2.2s / 287s · 13.3 / 1.4 hits | 14,646 dps · 2.8s / 288s · 13.8 / 1.6 hits | 14,912 dps · 2.4s / 288s · 15.8 / 1.8 hits | 15,177 dps · 3.2s / 397s · 10.9 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 7,858 dps · 3.7s / 406s · 24.5 / 2.8 hits | 8,014 dps · 3.4s / 442s · 17.9 / 2.5 hits | 8,171 dps · 3.4s / 483s · 17.8 / 3 hits | 8,327 dps · 3.8s / 486s · 14.5 / 2.2 hits | 8,484 dps · 3.8s / 486s · 10.8 / 1.1 hits | 8,640 dps · 4.7s / 488s · 11.3 / 1.3 hits | 8,797 dps · 4.1s / 488s · 12.8 / 1.5 hits | 8,953 dps · 5.4s / 673s · 8.9 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 7,843 dps · 3.8s / 407s · 27.9 / 3.2 hits | 7,999 dps · 3.4s / 443s · 20.3 / 2.8 hits | 8,155 dps · 3.4s / 484s · 20.2 / 3.4 hits | 8,311 dps · 3.8s / 487s · 16.5 / 2.5 hits | 8,467 dps · 3.8s / 487s · 12.3 / 1.3 hits | 8,623 dps · 4.7s / 489s · 12.8 / 1.5 hits | 8,780 dps · 4.1s / 489s · 14.6 / 1.7 hits | 8,936 dps · 5.4s / 674s · 10.1 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 6,699 dps · 4.4s / 476s · 24.5 / 2.8 hits | 6,831 dps · 3.9s / 519s · 17.9 / 2.5 hits | 6,963 dps · 4s / 567s · 17.8 / 3 hits | 7,095 dps · 4.4s / 570s · 14.5 / 2.2 hits | 7,227 dps · 4.5s / 571s · 10.8 / 1.1 hits | 7,358 dps · 5.6s / 573s · 11.3 / 1.3 hits | 7,490 dps · 4.9s / 573s · 12.8 / 1.5 hits | 7,622 dps · 6.4s / 790s · 8.9 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 4,627 dps · 6.4s / 689s · 24.5 / 2.8 hits | 4,719 dps · 5.7s / 752s · 17.9 / 2.5 hits | 4,810 dps · 5.8s / 820s · 17.8 / 3 hits | 4,902 dps · 6.4s / 826s · 14.5 / 2.2 hits | 4,993 dps · 6.5s / 826s · 10.8 / 1.1 hits | 5,085 dps · 8s / 829s · 11.3 / 1.3 hits | 5,177 dps · 7s / 830s · 12.8 / 1.5 hits | 5,268 dps · 9.2s / 1,144s · 8.9 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 6,241 + weapon 459 · Z2 Meteor, Void Rift, Arcane Beam; spells 6,363 + weapon 468 · Z3 Meteor, Void Rift, Arcane Beam; spells 6,486 + weapon 477 · Z4 Meteor, Void Rift, Arcane Beam; spells 6,609 + weapon 486 · Z5 Meteor, Void Rift, Arcane Beam; spells 6,731 + weapon 495 · Z6 Meteor, Void Rift, Arcane Beam; spells 6,854 + weapon 504 · Z7 Meteor, Void Rift, Arcane Beam; spells 6,977 + weapon 513 · Z8 Meteor, Void Rift, Arcane Beam; spells 7,099 + weapon 523
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,149 + weapon 2,478 · Z2 Sunray, Purify; spells 2,192 + weapon 2,527 · Z3 Sunray, Purify; spells 2,234 + weapon 2,577 · Z4 Sunray, Purify; spells 2,276 + weapon 2,626 · Z5 Sunray, Purify; spells 2,318 + weapon 2,675 · Z6 Sunray, Purify; spells 2,361 + weapon 2,725 · Z7 Sunray, Purify; spells 2,403 + weapon 2,774 · Z8 Sunray, Purify; spells 2,445 + weapon 2,823

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 406 | 202 | 689 | 3.4 |
| 2 | 442 | 220 | 752 | 3.4 |
| 3 | 483 | 240 | 820 | 3.4 |
| 4 | 486 | 242 | 826 | 3.4 |
| 5 | 486 | 242 | 826 | 3.4 |
| 6 | 488 | 243 | 829 | 3.4 |
| 7 | 488 | 243 | 830 | 3.4 |
| 8 | 673 | 335 | 1,144 | 3.4 |

### NG+7

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 18,314 dps · 1.9s / 202s · 29.6 / 3.4 hits | 18,628 dps · 1.7s / 221s · 21.6 / 3 hits | 18,943 dps · 1.7s / 241s · 21.4 / 3.6 hits | 19,257 dps · 1.9s / 244s · 17.4 / 2.7 hits | 19,572 dps · 1.9s / 244s · 13 / 1.4 hits | 19,886 dps · 2.4s / 246s · 13.4 / 1.5 hits | 20,201 dps · 2.1s / 246s · 15.3 / 1.8 hits | 20,515 dps · 2.7s / 340s · 10.6 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 9,479 dps · 3.6s / 390s · 26 / 3 hits | 9,642 dps · 3.2s / 426s · 18.9 / 2.6 hits | 9,804 dps · 3.3s / 466s · 18.8 / 3.1 hits | 9,967 dps · 3.6s / 471s · 15.3 / 2.4 hits | 10,130 dps · 3.7s / 472s · 11.4 / 1.2 hits | 10,293 dps · 4.6s / 475s · 11.8 / 1.3 hits | 10,456 dps · 4s / 476s · 13.4 / 1.6 hits | 10,618 dps · 5.3s / 658s · 9.3 / 0.6 hits ⚠1-shot |
| Quality: longsword + shield | 15,442 dps · 2.2s / 239s · 32 / 3.7 hits | 15,707 dps · 2s / 262s · 23.3 / 3.2 hits | 15,972 dps · 2s / 286s · 23.1 / 3.9 hits | 16,238 dps · 2.2s / 289s · 18.8 / 2.9 hits | 16,503 dps · 2.3s / 290s · 14 / 1.5 hits | 16,768 dps · 2.8s / 291s · 14.5 / 1.6 hits | 17,033 dps · 2.5s / 292s · 16.6 / 1.9 hits | 17,299 dps · 3.2s / 404s · 11.4 / 0.8 hits ⚠1-shot |
| Bow (Slicey) | 9,110 dps · 3.7s / 406s · 26 / 3 hits | 9,266 dps · 3.4s / 444s · 18.9 / 2.6 hits | 9,423 dps · 3.4s / 485s · 18.8 / 3.1 hits | 9,579 dps · 3.8s / 490s · 15.3 / 2.4 hits | 9,735 dps · 3.8s / 491s · 11.4 / 1.2 hits | 9,892 dps · 4.8s / 494s · 11.8 / 1.3 hits | 10,048 dps · 4.2s / 495s · 13.4 / 1.6 hits | 10,205 dps · 5.5s / 684s · 9.3 / 0.6 hits ⚠1-shot |
| Crossbow (Bonk) | 9,092 dps · 3.8s / 407s · 29.6 / 3.4 hits | 9,248 dps · 3.4s / 444s · 21.6 / 3 hits | 9,404 dps · 3.4s / 486s · 21.4 / 3.6 hits | 9,560 dps · 3.8s / 491s · 17.4 / 2.7 hits | 9,717 dps · 3.8s / 492s · 13 / 1.4 hits | 9,873 dps · 4.8s / 495s · 13.4 / 1.5 hits | 10,029 dps · 4.2s / 496s · 15.3 / 1.8 hits | 10,185 dps · 5.5s / 686s · 10.6 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 7,754 dps · 4.4s / 477s · 26 / 3 hits | 7,886 dps · 4s / 521s · 18.9 / 2.6 hits | 8,018 dps · 4s / 570s · 18.8 / 3.1 hits | 8,150 dps · 4.4s / 576s · 15.3 / 2.4 hits | 8,281 dps · 4.5s / 577s · 11.4 / 1.2 hits | 8,413 dps · 5.6s / 581s · 11.8 / 1.3 hits | 8,545 dps · 4.9s / 583s · 13.4 / 1.6 hits | 8,677 dps · 6.5s / 805s · 9.3 / 0.6 hits ⚠1-shot |
| Prayer caster: talisman spells | 5,360 dps · 6.4s / 690s · 26 / 3 hits | 5,451 dps · 5.7s / 754s · 18.9 / 2.6 hits | 5,543 dps · 5.8s / 825s · 18.8 / 3.1 hits | 5,635 dps · 6.4s / 833s · 15.3 / 2.4 hits | 5,726 dps · 6.5s / 835s · 11.4 / 1.2 hits | 5,818 dps · 8.1s / 840s · 11.8 / 1.3 hits | 5,910 dps · 7.1s / 842s · 13.4 / 1.6 hits | 6,001 dps · 9.4s / 1,164s · 9.3 / 0.6 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 7,222 + weapon 532 · Z2 Meteor, Void Rift, Arcane Beam; spells 7,345 + weapon 541 · Z3 Meteor, Void Rift, Arcane Beam; spells 7,468 + weapon 550 · Z4 Meteor, Void Rift, Arcane Beam; spells 7,590 + weapon 559 · Z5 Meteor, Void Rift, Arcane Beam; spells 7,713 + weapon 568 · Z6 Meteor, Void Rift, Arcane Beam; spells 7,836 + weapon 577 · Z7 Meteor, Void Rift, Arcane Beam; spells 7,959 + weapon 587 · Z8 Meteor, Void Rift, Arcane Beam; spells 8,081 + weapon 596
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,487 + weapon 2,873 · Z2 Sunray, Purify; spells 2,530 + weapon 2,922 · Z3 Sunray, Purify; spells 2,572 + weapon 2,971 · Z4 Sunray, Purify; spells 2,614 + weapon 3,021 · Z5 Sunray, Purify; spells 2,656 + weapon 3,070 · Z6 Sunray, Purify; spells 2,699 + weapon 3,119 · Z7 Sunray, Purify; spells 2,741 + weapon 3,169 · Z8 Sunray, Purify; spells 2,783 + weapon 3,218

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 406 | 202 | 690 | 3.4 |
| 2 | 444 | 221 | 754 | 3.4 |
| 3 | 485 | 241 | 825 | 3.4 |
| 4 | 490 | 244 | 833 | 3.4 |
| 5 | 491 | 244 | 835 | 3.4 |
| 6 | 494 | 246 | 840 | 3.4 |
| 7 | 495 | 246 | 842 | 3.4 |
| 8 | 684 | 340 | 1,164 | 3.4 |

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
| NG+1 | 1 | L87 | 428 | 1,987 | 4.6 | 675 | 46 | 14.8 | 1.71 | 1.13 |  |
| NG+1 | 2 | L100 | 543 | 1,900 | 3.5 | 715 | 65 | 10.9 | 1.29 | 0.83 |  |
| NG+1 | 3 | L113 | 670 | 2,044 | 3 | 755 | 65 | 11.7 | 1.12 | 0.89 |  |
| NG+1 | 4 | L125 | 751 | 2,381 | 3.2 | 795 | 66 | 12 | 1.17 | 0.92 |  |
| NG+1 | 5 | L138 | 844 | 2,581 | 3.1 | 840 | 77 | 10.8 | 1.13 | 0.83 |  |
| NG+1 | 6 | L151 | 935 | 3,420 | 3.7 | 898 | 85 | 10.6 | 1.35 | 0.81 |  |
| NG+1 | 7 | L166 | 1,052 | 3,221 | 3.1 | 956 | 75 | 12.7 | 1.13 | 0.97 |  |
| NG+1 | 8 | L181 | 1,212 | 4,429 | 3.7 | 1,028 | 109 | 9.5 | 1.35 | 0.72 |  |
| NG+2 | 1 | L196 | 1,517 | 6,853 | 4.5 | 1,086 | 74 | 14.7 | 1.66 | 1.12 |  |
| NG+2 | 2 | L210 | 1,855 | 6,456 | 3.5 | 1,144 | 108 | 10.6 | 1.28 | 0.81 |  |
| NG+2 | 3 | L223 | 2,212 | 6,838 | 3.1 | 1,202 | 113 | 10.7 | 1.14 | 0.81 |  |
| NG+2 | 4 | L236 | 2,458 | 7,872 | 3.2 | 1,260 | 117 | 10.8 | 1.18 | 0.82 |  |
| NG+2 | 5 | L249 | 2,730 | 8,388 | 3.1 | 1,318 | 145 | 9.1 | 1.13 | 0.7 |  |
| NG+2 | 6 | L263 | 3,040 | 10,968 | 3.6 | 1,376 | 160 | 8.6 | 1.33 | 0.66 |  |
| NG+2 | 7 | L279 | 3,377 | 10,117 | 3 | 1,449 | 142 | 10.2 | 1.1 | 0.78 |  |
| NG+2 | 8 | L294 | 3,734 | 13,892 | 3.7 | 1,507 | 210 | 7.2 | 1.37 | 0.55 |  |
| NG+3 | 1 | L309 | 4,348 | 13,389 | 3.1 | 1,536 | 87 | 17.6 | 1.13 | 1.34 |  |
| NG+3 | 2 | L323 | 5,026 | 12,160 | 2.4 | 1,536 | 126 | 12.2 | 0.89 | 0.93 |  |
| NG+3 | 3 | L336 | 5,742 | 12,542 | 2.2 | 1,536 | 131 | 11.7 | 0.8 | 0.9 |  |
| NG+3 | 4 | L350 | 6,243 | 14,026 | 2.2 | 1,536 | 134 | 11.5 | 0.83 | 0.87 |  |
| NG+3 | 5 | L364 | 6,659 | 14,474 | 2.2 | 1,536 | 165 | 9.3 | 0.8 | 0.71 |  |
| NG+3 | 6 | L379 | 6,940 | 18,345 | 2.6 | 1,536 | 181 | 8.5 | 0.97 | 0.65 |  |
| NG+3 | 7 | L395 | 7,214 | 16,355 | 2.3 | 1,536 | 156 | 9.8 | 0.83 | 0.75 |  |
| NG+3 | 8 | L411 | 7,490 | 21,741 | 2.9 | 1,536 | 233 | 6.6 | 1.07 | 0.5 |  |
| NG+4 | 1 | L426 | 8,184 | 21,065 | 2.6 | 1,536 | 81 | 19.1 | 0.95 | 1.45 |  |
| NG+4 | 2 | L441 | 8,891 | 19,165 | 2.2 | 1,536 | 117 | 13.1 | 0.79 | 1 |  |
| NG+4 | 3 | L456 | 9,607 | 19,799 | 2.1 | 1,536 | 124 | 12.4 | 0.76 | 0.94 |  |
| NG+4 | 4 | L470 | 9,872 | 22,141 | 2.2 | 1,536 | 128 | 12 | 0.83 | 0.91 |  |
| NG+4 | 5 | L484 | 10,138 | 22,848 | 2.3 | 1,536 | 159 | 9.6 | 0.83 | 0.74 |  |
| NG+4 | 6 | L499 | 10,403 | 28,958 | 2.8 | 1,536 | 176 | 8.7 | 1.02 | 0.67 |  |
| NG+4 | 7 | L516 | 10,668 | 25,817 | 2.4 | 1,536 | 152 | 10.1 | 0.89 | 0.77 |  |
| NG+4 | 8 | L533 | 10,933 | 34,319 | 3.1 | 1,536 | 230 | 6.7 | 1.16 | 0.51 |  |
| NG+5 | 1 | L550 | 11,198 | 25,221 | 2.3 | 1,536 | 69 | 22.3 | 0.83 | 1.7 |  |
| NG+5 | 2 | L566 | 11,464 | 23,049 | 2 | 1,536 | 105 | 14.6 | 0.74 | 1.11 |  |
| NG+5 | 3 | L581 | 11,729 | 23,907 | 2 | 1,536 | 118 | 13 | 0.75 | 0.99 |  |
| NG+5 | 4 | L595 | 11,994 | 26,736 | 2.2 | 1,536 | 122 | 12.6 | 0.82 | 0.96 |  |
| NG+5 | 5 | L609 | 12,259 | 27,590 | 2.3 | 1,536 | 153 | 10.1 | 0.83 | 0.77 |  |
| NG+5 | 6 | L624 | 12,525 | 34,967 | 2.8 | 1,536 | 170 | 9.1 | 1.03 | 0.69 |  |
| NG+5 | 7 | L642 | 12,790 | 31,174 | 2.4 | 1,536 | 146 | 10.5 | 0.9 | 0.8 |  |
| NG+5 | 8 | L659 | 13,055 | 41,441 | 3.2 | 1,536 | 224 | 6.9 | 1.17 | 0.52 |  |
| NG+6 | 1 | L676 | 13,320 | 29,465 | 2.2 | 1,536 | 66 | 23.3 | 0.81 | 1.78 |  |
| NG+6 | 2 | L693 | 13,585 | 26,927 | 2 | 1,536 | 101 | 15.1 | 0.73 | 1.15 |  |
| NG+6 | 3 | L708 | 13,851 | 27,929 | 2 | 1,536 | 114 | 13.5 | 0.74 | 1.03 |  |
| NG+6 | 4 | L724 | 14,116 | 31,234 | 2.2 | 1,536 | 118 | 13 | 0.81 | 0.99 |  |
| NG+6 | 5 | L739 | 14,381 | 32,232 | 2.2 | 1,536 | 149 | 10.3 | 0.83 | 0.79 |  |
| NG+6 | 6 | L756 | 14,646 | 40,850 | 2.8 | 1,536 | 166 | 9.3 | 1.03 | 0.71 |  |
| NG+6 | 7 | L774 | 14,912 | 36,419 | 2.4 | 1,536 | 143 | 10.7 | 0.9 | 0.82 |  |
| NG+6 | 8 | L793 | 15,177 | 48,413 | 3.2 | 1,536 | 220 | 7 | 1.17 | 0.53 |  |
| NG+7 | 1 | L811 | 15,442 | 34,149 | 2.2 | 1,536 | 62 | 24.7 | 0.81 | 1.88 |  |
| NG+7 | 2 | L828 | 15,707 | 31,208 | 2 | 1,536 | 96 | 16 | 0.73 | 1.22 |  |
| NG+7 | 3 | L845 | 15,972 | 32,369 | 2 | 1,536 | 108 | 14.2 | 0.75 | 1.09 |  |
| NG+7 | 4 | L861 | 16,238 | 36,200 | 2.2 | 1,536 | 112 | 13.7 | 0.82 | 1.04 |  |
| NG+7 | 5 | L876 | 16,503 | 37,356 | 2.3 | 1,536 | 142 | 10.8 | 0.83 | 0.83 |  |
| NG+7 | 6 | L893 | 16,768 | 47,345 | 2.8 | 1,536 | 158 | 9.7 | 1.04 | 0.74 |  |
| NG+7 | 7 | L913 | 17,033 | 42,209 | 2.5 | 1,536 | 137 | 11.2 | 0.91 | 0.86 |  |
| NG+7 | 8 | L932 | 17,299 | 56,110 | 3.2 | 1,536 | 211 | 7.3 | 1.19 | 0.56 |  |
| NG+10 | 1 | L1250 | 21,807 | 56,365 | 2.6 | 1,536 | 154 | 10 | 0.95 | 0.76 |  |
| NG+10 | 2 | L1269 | 22,073 | 51,511 | 2.3 | 1,536 | 238 | 6.5 | 0.86 | 0.49 | ⚠ survives 2× fewer hits |
| NG+10 | 3 | L1287 | 22,338 | 53,428 | 2.4 | 1,536 | 269 | 5.7 | 0.88 | 0.44 | ⚠ survives 2.3× fewer hits |
| NG+10 | 4 | L1305 | 22,603 | 59,750 | 2.6 | 1,536 | 282 | 5.5 | 0.97 | 0.42 | ⚠ survives 2.4× fewer hits |
| NG+10 | 5 | L1323 | 22,868 | 61,658 | 2.7 | 1,536 | 357 | 4.3 | 0.99 | 0.33 | ⚠ survives 3× fewer hits |
| NG+10 | 6 | L1342 | 23,134 | 78,146 | 3.4 | 1,536 | 400 | 3.8 | 1.24 | 0.29 | ⚠ survives 3.4× fewer hits |
| NG+10 | 7 | L1364 | 23,399 | 69,669 | 3 | 1,536 | 347 | 4.4 | 1.1 | 0.34 | ⚠ survives 3× fewer hits |
| NG+10 | 8 | L1386 | 23,664 | 92,613 | 3.9 | 1,536 | 540 | 2.8 | 1.44 | 0.22 | ⚠ survives 4.6× fewer hits |

