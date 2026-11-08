# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **Build spread** (severity 4.8): NG+4 zone 2: the slowest build (Prayer caster: talisman spells) takes 805 s on the boss, 3.7× the fastest (Bonk: greathammer (2H), 218 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
2. **Build spread** (severity 4.8): NG+4 zone 1: the slowest build (Prayer caster: talisman spells) takes 781 s on the boss, 3.7× the fastest (Bonk: greathammer (2H), 212 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
3. **Build spread** (severity 4.8): NG+4 zone 3: the slowest build (Prayer caster: talisman spells) takes 821 s on the boss, 3.7× the fastest (Bonk: greathammer (2H), 223 s). *Suggested:* Bring the slow build's damage source up (or the fast one down).
4. **Gems** (severity 4.6): Quicksilver raises sustained DPS by +3% (burst +7%) where Brutal gives +6% (0.41× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
5. **Weapon skills** (severity 4.3): Colossal Sword's skills deal 273 damage per second of cooldown, 2.24× the median weapon's (122). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
6. **Weapon skills** (severity 4.3): Greathammer's skills deal 273 damage per second of cooldown, 2.24× the median weapon's (122). *Suggested:* Lower the skill multipliers or lengthen the cooldowns.
7. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
8. **Weapons** (severity 3.8): Greathammer: 228 sustained light-attack DPS, 1.52× the median weapon (150) at equal fitting stats. *Suggested:* Lower its base damage or combo multipliers, or raise its stamina cost.
9. **Enemy curve** (severity 3.8): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 108. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
10. **Spells** (severity 3.5): Arcane Beam (brain): 16.4 damage per busy second at Spell Skill 100, 2.05× the brain median (8). *Suggested:* Lengthen its cooldown or lower its base.
11. **Enemy curve** (severity 3.2): NG+10: zone 7 room enemies have 69,669 HP on average, below zone 6's 78,146. *Suggested:* Check the zone roster mix and the HP curve.
12. **Enemy curve** (severity 3.2): NG+3: zone 7 room enemies have 16,355 HP on average, below zone 6's 18,345. *Suggested:* Check the zone roster mix and the HP curve.
13. **Enemy curve** (severity 3.2): NG+7: zone 7 room enemies have 42,209 HP on average, below zone 6's 47,345. *Suggested:* Check the zone roster mix and the HP curve.
14. **Gear power** (severity 3): Reinforcement reaches ×3.25 at +15, while the whole rarity ladder is ×1.28: a +15 common out-hits a +0 legendary 2.5×, so drops matter little once reinforcement starts. *Suggested:* Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.

(75 more findings of the same kinds are in the tables below.)

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
| 1 | The Caretaker | 2 | 1,260 / 1,260 | 2,520 | 69 / 72 | 118 |  |
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
| 1 | The Caretaker | 3 | 32,064 / 48,096 / 48,096 | 128,257 | 351 / 367 / 412 | 689 |  |
| 2 | Mother Spore | 3 | 42,868 / 64,303 / 64,303 | 171,474 | 236 / 358 / 440 | 697 |  |
| 3 | The Bloatking | 3 | 52,854 / 79,282 / 79,282 | 211,418 | 289 / 372 / 453 | 590 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 61,822 / 92,732 / 92,732 | 247,286 | 353 / 495 / 589 | 821 |  |
| 5 | Foreman Ignatius | 3 | 108,088 / 90,074 / 90,074 | 288,236 | 404 / 585 / 682 | 1,189 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 41,850 / 146,474 / 146,474 | 334,797 | 399 / 606 / 663 | 1,123 |  |
| 7 | Archmagister Tock | 3 | 114,544 / 133,635 / 133,635 | 381,813 | 607 / 919 / 1,089 | 1,387 |  |
| 8 | The Landlord | 4 | 165,761 / 160,886 / 160,885 / 193,063 | 680,596 | 736 / 936 / 1,380 / 1,170 | 2,087 |  |

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
| 1 | The Caretaker | 3 | 197,112 / 295,668 / 295,668 | 788,448 | 1,101 / 1,149 / 1,291 | 2,159 |  |
| 2 | Mother Spore | 3 | 228,020 / 342,030 / 342,030 | 912,080 | 747 / 1,133 / 1,391 | 2,203 |  |
| 3 | The Bloatking | 3 | 259,426 / 389,139 / 389,139 | 1,037,705 | 929 / 1,197 / 1,458 | 1,899 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 275,070 / 412,605 / 412,605 | 1,100,280 | 1,137 / 1,592 / 1,895 | 2,643 |  |
| 5 | Foreman Ignatius | 3 | 434,345 / 361,955 / 361,955 | 1,158,254 | 1,322 / 1,916 / 2,233 | 3,894 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 153,185 / 536,146 / 536,146 | 1,225,476 | 1,292 / 1,961 / 2,145 | 3,631 |  |
| 7 | Archmagister Tock | 3 | 387,032 / 451,538 / 451,538 | 1,290,107 | 1,971 / 2,984 / 3,536 | 4,500 |  |
| 8 | The Landlord | 4 | 457,692 / 444,231 / 444,230 / 533,077 | 1,879,229 | 2,333 / 2,969 / 4,377 / 3,710 | 6,617 |  |

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
| 1 | The Caretaker | 3 | 385,122 / 577,684 / 577,684 | 1,540,489 | 2,170 / 2,265 / 2,543 | 4,254 |  |
| 2 | Mother Spore | 3 | 429,432 / 644,148 / 644,148 | 1,717,729 | 1,437 / 2,181 / 2,675 | 4,238 |  |
| 3 | The Bloatking | 3 | 475,805 / 713,708 / 713,708 | 1,903,221 | 1,738 / 2,240 / 2,729 | 3,554 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 490,144 / 735,216 / 735,216 | 1,960,576 | 2,076 / 2,908 / 3,460 | 4,825 |  |
| 5 | Foreman Ignatius | 3 | 749,456 / 624,548 / 624,548 | 1,998,552 | 2,359 / 3,418 / 3,984 | 6,949 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 256,208 / 896,728 / 896,728 | 2,049,664 | 2,255 / 3,425 / 3,746 | 6,340 |  |
| 7 | Archmagister Tock | 3 | 625,645 / 729,919 / 729,919 | 2,085,482 | 3,356 / 5,081 / 6,021 | 7,663 |  |
| 8 | The Landlord | 4 | 716,267 / 695,201 / 695,200 / 834,241 | 2,940,909 | 3,907 / 4,972 / 7,330 / 6,213 | 11,081 |  |

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
| 1 | The Caretaker | 3 | 605,926 / 908,889 / 908,889 | 2,423,703 | 3,030 / 3,162 / 3,551 | 5,939 |  |
| 2 | Mother Spore | 3 | 676,857 / 1,015,285 / 1,015,285 | 2,707,427 | 2,007 / 3,045 / 3,736 | 5,918 |  |
| 3 | The Bloatking | 3 | 751,093 / 1,126,639 / 1,126,639 | 3,004,370 | 2,427 / 3,128 / 3,810 | 4,962 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 773,727 / 1,160,591 / 1,160,591 | 3,094,910 | 2,898 / 4,060 / 4,831 | 6,737 |  |
| 5 | Foreman Ignatius | 3 | 1,183,071 / 985,893 / 985,893 | 3,154,858 | 3,294 / 4,773 / 5,563 | 9,702 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 404,443 / 1,415,549 / 1,415,549 | 3,235,541 | 3,149 / 4,782 / 5,231 | 8,852 |  |
| 7 | Archmagister Tock | 3 | 987,625 / 1,152,229 / 1,152,229 | 3,292,082 | 4,686 / 7,094 / 8,406 | 10,699 |  |
| 8 | The Landlord | 4 | 1,130,679 / 1,097,424 / 1,097,423 / 1,316,909 | 4,642,435 | 5,455 / 6,942 / 10,235 / 8,675 | 15,471 |  |

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
| 1 | The Caretaker | 3 | 725,455 / 1,088,182 / 1,088,182 | 2,901,820 | 3,484 / 3,636 / 4,084 | 6,830 |  |
| 2 | Mother Spore | 3 | 814,009 / 1,221,013 / 1,221,013 | 3,256,036 | 2,308 / 3,501 / 4,296 | 6,805 |  |
| 3 | The Bloatking | 3 | 906,944 / 1,360,416 / 1,360,416 | 3,627,777 | 2,791 / 3,597 / 4,381 | 5,706 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 934,276 / 1,401,414 / 1,401,414 | 3,737,103 | 3,333 / 4,669 / 5,556 | 7,748 |  |
| 5 | Foreman Ignatius | 3 | 1,428,558 / 1,190,466 / 1,190,466 | 3,809,491 | 3,788 / 5,489 / 6,397 | 11,158 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 488,365 / 1,709,276 / 1,709,276 | 3,906,916 | 3,621 / 5,499 / 6,016 | 10,180 |  |
| 7 | Archmagister Tock | 3 | 1,192,557 / 1,391,316 / 1,391,316 | 3,975,189 | 5,389 / 8,158 / 9,667 | 12,303 |  |
| 8 | The Landlord | 4 | 1,365,295 / 1,325,140 / 1,325,139 / 1,590,167 | 5,605,741 | 6,273 / 7,984 / 11,770 / 9,976 | 17,792 |  |

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
| 1 | The Caretaker | 3 | 847,516 / 1,271,273 / 1,271,273 | 3,390,062 | 3,953 / 4,125 / 4,633 | 7,749 |  |
| 2 | Mother Spore | 3 | 950,969 / 1,426,454 / 1,426,454 | 3,803,877 | 2,618 / 3,972 / 4,873 | 7,720 |  |
| 3 | The Bloatking | 3 | 1,059,541 / 1,589,312 / 1,589,312 | 4,238,165 | 3,166 / 4,081 / 4,971 | 6,473 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 1,091,471 / 1,637,207 / 1,637,207 | 4,365,886 | 3,781 / 5,297 / 6,303 | 8,790 |  |
| 5 | Foreman Ignatius | 3 | 1,668,919 / 1,390,767 / 1,390,767 | 4,450,453 | 4,297 / 6,227 / 7,257 | 12,658 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 570,534 / 1,996,868 / 1,996,868 | 4,564,270 | 4,108 / 6,239 / 6,824 | 11,549 |  |
| 7 | Archmagister Tock | 3 | 1,393,209 / 1,625,411 / 1,625,411 | 4,644,031 | 6,114 / 9,255 / 10,967 | 13,958 |  |
| 8 | The Landlord | 4 | 1,595,012 / 1,548,100 / 1,548,099 / 1,857,719 | 6,548,929 | 7,116 / 9,057 / 13,353 / 11,317 | 20,184 |  |

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
| 1 | The Caretaker | 3 | 982,257 / 1,473,386 / 1,473,386 | 3,929,029 | 4,297 / 4,484 / 5,036 | 8,423 |  |
| 2 | Mother Spore | 3 | 1,102,158 / 1,653,238 / 1,653,238 | 4,408,633 | 2,846 / 4,318 / 5,297 | 8,392 |  |
| 3 | The Bloatking | 3 | 1,227,992 / 1,841,988 / 1,841,988 | 4,911,967 | 3,442 / 4,436 / 5,403 | 7,036 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 1,264,998 / 1,897,497 / 1,897,497 | 5,059,993 | 4,110 / 5,757 / 6,851 | 9,554 |  |
| 5 | Foreman Ignatius | 3 | 1,934,252 / 1,611,877 / 1,611,877 | 5,158,006 | 4,671 / 6,768 / 7,888 | 13,759 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 661,240 / 2,314,339 / 2,314,339 | 5,289,918 | 4,466 / 6,781 / 7,418 | 12,554 |  |
| 7 | Archmagister Tock | 3 | 1,614,708 / 1,883,826 / 1,883,826 | 5,382,359 | 6,645 / 10,060 / 11,921 | 15,172 |  |
| 8 | The Landlord | 4 | 1,848,594 / 1,794,223 / 1,794,222 / 2,153,068 | 7,590,107 | 7,735 / 9,845 / 14,514 / 12,301 | 21,940 |  |

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
| 1 | The Caretaker | 3 | 1,621,277 / 2,431,915 / 2,431,915 | 6,485,107 | 14,869 / 15,517 / 17,426 | 29,147 |  |
| 2 | Mother Spore | 3 | 1,819,181 / 2,728,771 / 2,728,771 | 7,276,723 | 9,849 / 14,941 / 18,332 | 29,041 |  |
| 3 | The Bloatking | 3 | 2,026,877 / 3,040,315 / 3,040,315 | 8,107,506 | 11,910 / 15,351 / 18,697 | 24,350 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 2,087,958 / 3,131,937 / 3,131,937 | 8,351,833 | 14,224 / 19,923 / 23,710 | 33,063 |  |
| 5 | Foreman Ignatius | 3 | 3,192,603 / 2,660,503 / 2,660,503 | 8,513,609 | 16,164 / 23,422 / 27,298 | 47,613 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 1,091,417 / 3,819,960 / 3,819,960 | 8,731,337 | 15,454 / 23,467 / 25,671 | 43,442 |  |
| 7 | Archmagister Tock | 3 | 2,665,175 / 3,109,371 / 3,109,371 | 8,883,917 | 22,996 / 34,812 / 41,252 | 52,503 |  |
| 8 | The Landlord | 4 | 3,051,218 / 2,961,477 / 2,961,476 / 3,553,772 | 12,527,942 | 26,768 / 34,069 / 50,227 / 42,570 | 75,925 |  |

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
| Bonk: greathammer (2H) | 41 dps · 2.2s / 62s · 17.7 / 3.2 hits | 65 dps · 1.9s / 86s · 23.2 / 3.1 hits | 99 dps · 1.7s / 76s · 19.4 / 3.9 hits | 154 dps · 1.4s / 68s · 17.8 / 3.2 hits | 242 dps · 1s / 71s · 15.4 / 2.2 hits | 388 dps · 0.9s / 49s · 16.6 / 2.8 hits | 503 dps · 0.7s / 42s · 17.6 / 3 hits | 640 dps · 0.8s / 88s · 18.2 / 1.4 hits |
| Slicey: twin daggers | 26 dps · 3.5s / 97s · 13 / 2.3 hits | 41 dps · 3s / 135s · 17.4 / 2.4 hits | 63 dps · 2.6s / 119s · 14.8 / 3 hits | 99 dps · 2.2s / 106s · 13.8 / 2.5 hits | 143 dps · 1.8s / 120s · 12.1 / 1.7 hits | 211 dps · 1.7s / 89s · 13.2 / 2.2 hits | 254 dps · 1.4s / 83s · 14.2 / 2.4 hits | 305 dps · 1.7s / 185s · 15.2 / 1.1 hits |
| Quality: longsword + shield | 34 dps · 2.7s / 74s · 16.8 / 3 hits | 52 dps · 2.3s / 107s · 22.4 / 3 hits | 79 dps · 2.1s / 96s · 19 / 3.8 hits | 120 dps · 1.8s / 87s · 17.7 / 3.2 hits | 171 dps · 1.5s / 100s · 15.5 / 2.2 hits | 249 dps · 1.4s / 76s · 16.7 / 2.8 hits | 301 dps · 1.2s / 70s · 18 / 3 hits | 350 dps · 1.5s / 161s · 18.9 / 1.4 hits |
| Bow (Slicey) | 26 dps · 3.4s / 96s · 12.2 / 2.2 hits | 41 dps · 3s / 137s · 16.5 / 2.2 hits | 61 dps · 2.7s / 124s · 14.1 / 2.8 hits | 97 dps · 2.2s / 109s · 13.3 / 2.4 hits | 138 dps · 1.8s / 124s · 11.7 / 1.7 hits | 200 dps · 1.8s / 94s · 12.7 / 2.1 hits | 238 dps · 1.5s / 88s · 13.8 / 2.3 hits | 276 dps · 1.9s / 204s · 14.8 / 1.1 hits |
| Crossbow (Bonk) | 27 dps · 3.3s / 92s · 17.7 / 3.2 hits | 43 dps · 2.9s / 131s · 23.2 / 3.1 hits | 63 dps · 2.6s / 119s · 19.4 / 3.9 hits | 97 dps · 2.2s / 109s · 17.8 / 3.2 hits | 142 dps · 1.8s / 121s · 15.4 / 2.2 hits | 206 dps · 1.7s / 91s · 16.6 / 2.8 hits | 245 dps · 1.4s / 86s · 17.6 / 3 hits | 290 dps · 1.8s / 194s · 18.2 / 1.4 hits |
| Brain caster: staff spells | 37 dps · 2.4s / 68s · 12.2 / 2.2 hits | 63 dps · 1.9s / 88s · 16.5 / 2.2 hits | 95 dps · 1.7s / 79s · 14.1 / 2.8 hits | 138 dps · 1.6s / 76s · 13.3 / 2.4 hits | 190 dps · 1.3s / 90s · 11.7 / 1.7 hits | 267 dps · 1.3s / 70s · 12.7 / 2.1 hits | 318 dps · 1.1s / 66s · 13.8 / 2.3 hits | 373 dps · 1.4s / 151s · 14.8 / 1.1 hits |
| Prayer caster: talisman spells | 37 dps · 2.4s / 69s · 13 / 2.3 hits | 33 dps · 3.7s / 167s · 17.4 / 2.4 hits | 49 dps · 3.4s / 155s · 14.8 / 3 hits | 73 dps · 3s / 143s · 13.8 / 2.5 hits | 103 dps · 2.5s / 167s · 12.1 / 1.7 hits | 147 dps · 2.4s / 128s · 13.2 / 2.2 hits | 177 dps · 2s / 119s · 14.2 / 2.4 hits | 212 dps · 2.5s / 266s · 15.2 / 1.1 hits |

- Brain caster: staff spells: Z1 Void Rift, Frost Lance, Fireball; spells 33 + weapon 4 · Z2 Void Rift, Arcane Beam, Frost Lance; spells 61 + weapon 3 · Z3 Meteor, Void Rift, Arcane Beam; spells 90 + weapon 5 · Z4 Meteor, Void Rift, Arcane Beam; spells 130 + weapon 8 · Z5 Meteor, Void Rift, Arcane Beam; spells 178 + weapon 11 · Z6 Meteor, Void Rift, Arcane Beam; spells 251 + weapon 16 · Z7 Meteor, Void Rift, Arcane Beam; spells 299 + weapon 19 · Z8 Meteor, Void Rift, Arcane Beam; spells 351 + weapon 22
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 13 + weapon 23 · Z2 Sunray, Purify; spells 19 + weapon 14 · Z3 Sunray, Purify; spells 27 + weapon 22 · Z4 Sunray, Purify; spells 40 + weapon 34 · Z5 Sunray, Purify; spells 55 + weapon 47 · Z6 Sunray, Purify; spells 78 + weapon 69 · Z7 Sunray, Purify; spells 93 + weapon 83 · Z8 Sunray, Purify; spells 111 + weapon 101

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 74 | 62 | 97 | 1.6 |
| 2 | 131 | 86 | 167 | 2 |
| 3 | 119 | 76 | 155 | 2 |
| 4 | 106 | 68 | 143 | 2.1 |
| 5 | 120 | 71 | 167 | 2.4 |
| 6 | 89 | 49 | 128 | 2.6 |
| 7 | 83 | 42 | 119 | 2.8 |
| 8 | 185 | 88 | 266 | 3 |

### NG+1

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 887 dps · 2.2s / 145s · 18.2 / 3 hits | 1,213 dps · 1.6s / 141s · 15.2 / 3.6 hits | 1,569 dps · 1.3s / 135s · 17.8 / 5.2 hits | 1,829 dps · 1.3s / 135s · 15.9 / 4.2 hits | 2,119 dps · 1.2s / 136s · 13.5 / 2.5 hits | 2,433 dps · 1.4s / 138s · 15.1 / 3 hits | 2,870 dps · 1.1s / 133s · 17.6 / 3.5 hits | 3,137 dps · 1.4s / 217s · 14 / 1.7 hits |
| Slicey: twin daggers | 427 dps · 4.7s / 300s · 15.3 / 2.5 hits | 586 dps · 3.2s / 292s · 12.8 / 3 hits | 777 dps · 2.6s / 272s · 15 / 4.4 hits | 926 dps · 2.6s / 267s · 13.4 / 3.5 hits | 1,097 dps · 2.4s / 263s · 11.3 / 2.1 hits | 1,282 dps · 2.7s / 261s · 12.5 / 2.5 hits | 1,520 dps · 2.1s / 251s · 14.7 / 2.9 hits | 1,670 dps · 2.7s / 408s · 11.7 / 1.4 hits |
| Quality: longsword + shield | 449 dps · 4.4s / 286s · 18.9 / 3.1 hits | 571 dps · 3.3s / 300s · 15.9 / 3.8 hits | 707 dps · 2.9s / 299s · 18.6 / 5.4 hits | 794 dps · 3s / 311s · 16.6 / 4.4 hits | 895 dps · 2.9s / 322s · 14.1 / 2.6 hits | 994 dps · 3.4s / 337s · 15.8 / 3.1 hits | 1,121 dps · 2.9s / 341s · 18.4 / 3.7 hits | 1,295 dps · 3.4s / 526s · 14.7 / 1.8 hits |
| Bow (Slicey) | 385 dps · 5.2s / 334s · 15 / 2.5 hits | 518 dps · 3.7s / 331s · 12.6 / 3 hits | 673 dps · 3s / 314s · 14.8 / 4.3 hits | 793 dps · 3s / 312s · 13.2 / 3.5 hits | 939 dps · 2.7s / 307s · 11.1 / 2.1 hits | 1,087 dps · 3.1s / 308s · 12.3 / 2.4 hits | 1,272 dps · 2.5s / 300s · 14.5 / 2.9 hits | 1,420 dps · 3.1s / 479s · 11.5 / 1.4 hits |
| Crossbow (Bonk) | 395 dps · 5s / 325s · 18.2 / 3 hits | 530 dps · 3.6s / 324s · 15.2 / 3.6 hits | 702 dps · 2.9s / 301s · 17.8 / 5.2 hits | 825 dps · 2.9s / 300s · 15.9 / 4.2 hits | 963 dps · 2.7s / 299s · 13.5 / 2.5 hits | 1,113 dps · 3.1s / 301s · 15.1 / 3 hits | 1,301 dps · 2.5s / 294s · 17.6 / 3.5 hits | 1,424 dps · 3.1s / 478s · 14 / 1.7 hits |
| Brain caster: staff spells | 493 dps · 4s / 260s · 15 / 2.5 hits | 635 dps · 3s / 270s · 12.6 / 3 hits | 803 dps · 2.5s / 263s · 14.8 / 4.3 hits | 918 dps · 2.6s / 269s · 13.2 / 3.5 hits | 1,048 dps · 2.5s / 275s · 11.1 / 2.1 hits | 1,187 dps · 2.9s / 282s · 12.3 / 2.4 hits | 1,274 dps · 2.5s / 300s · 14.9 / 3 hits | 1,352 dps · 3.3s / 503s · 11.5 / 1.4 hits |
| Prayer caster: talisman spells | 288 dps · 6.9s / 445s · 15.3 / 2.5 hits | 381 dps · 5s / 450s · 12.8 / 3 hits | 492 dps · 4.2s / 430s · 15 / 4.4 hits | 572 dps · 4.2s / 432s · 13.4 / 3.5 hits | 668 dps · 3.9s / 431s · 11.3 / 2.1 hits | 769 dps · 4.4s / 435s · 12.5 / 2.5 hits | 840 dps · 3.8s / 455s · 15.1 / 3 hits | 900 dps · 4.9s / 756s · 11.7 / 1.4 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 465 + weapon 28 · Z2 Meteor, Void Rift, Arcane Beam; spells 601 + weapon 35 · Z3 Meteor, Void Rift, Arcane Beam; spells 761 + weapon 42 · Z4 Meteor, Void Rift, Arcane Beam; spells 870 + weapon 48 · Z5 Meteor, Void Rift, Arcane Beam; spells 995 + weapon 53 · Z6 Meteor, Void Rift, Arcane Beam; spells 1,128 + weapon 59 · Z7 Meteor, Void Rift, Arcane Beam; spells 1,209 + weapon 64 · Z8 Meteor, Void Rift, Arcane Beam; spells 1,281 + weapon 71
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 150 + weapon 139 · Z2 Sunray, Purify; spells 196 + weapon 185 · Z3 Sunray, Purify; spells 252 + weapon 240 · Z4 Sunray, Purify; spells 291 + weapon 281 · Z5 Sunray, Purify; spells 336 + weapon 332 · Z6 Sunray, Purify; spells 384 + weapon 385 · Z7 Sunray, Purify; spells 416 + weapon 423 · Z8 Sunray, Purify; spells 441 + weapon 459

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 300 | 145 | 445 | 3.1 |
| 2 | 300 | 141 | 450 | 3.2 |
| 3 | 299 | 135 | 430 | 3.2 |
| 4 | 300 | 135 | 432 | 3.2 |
| 5 | 299 | 136 | 431 | 3.2 |
| 6 | 301 | 138 | 435 | 3.2 |
| 7 | 300 | 133 | 455 | 3.4 |
| 8 | 479 | 217 | 756 | 3.5 |

### NG+2

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 3,623 dps · 1.9s / 218s · 18.3 / 3.1 hits | 4,133 dps · 1.6s / 221s · 15 / 3.6 hits | 4,695 dps · 1.5s / 221s · 16.5 / 4.8 hits | 4,980 dps · 1.6s / 221s · 14.2 / 3.8 hits | 5,251 dps · 1.6s / 221s · 11.3 / 2.1 hits | 5,543 dps · 2s / 221s · 12.2 / 2.4 hits | 5,839 dps · 1.7s / 221s · 14.3 / 2.9 hits | 6,176 dps · 2.2s / 304s · 10.6 / 1.3 hits |
| Slicey: twin daggers | 1,935 dps · 3.5s / 407s · 15.3 / 2.6 hits | 2,208 dps · 2.9s / 413s · 12.6 / 3 hits | 2,510 dps · 2.7s / 413s · 13.9 / 4.1 hits | 2,671 dps · 2.9s / 412s · 12 / 3.2 hits | 2,817 dps · 3s / 411s · 9.5 / 1.8 hits | 2,983 dps · 3.7s / 411s · 10.3 / 2.1 hits | 3,143 dps · 3.2s / 410s · 12.1 / 2.4 hits | 3,305 dps · 4.2s / 569s · 9.1 / 1.1 hits |
| Quality: longsword + shield | 1,624 dps · 4.2s / 486s · 18.9 / 3.2 hits | 1,989 dps · 3.2s / 459s · 15.4 / 3.7 hits | 2,376 dps · 2.9s / 437s · 17.2 / 5 hits | 2,644 dps · 3s / 416s · 14.9 / 4 hits | 2,940 dps · 2.9s / 394s · 11.8 / 2.2 hits | 3,279 dps · 3.3s / 374s · 12.8 / 2.5 hits | 3,648 dps · 2.8s / 354s · 15 / 3 hits | 4,039 dps · 3.4s / 465s · 11.2 / 1.4 hits |
| Bow (Slicey) | 1,640 dps · 4.2s / 481s · 15.1 / 2.5 hits | 1,871 dps · 3.5s / 488s · 12.5 / 3 hits | 2,145 dps · 3.2s / 484s · 13.7 / 4 hits | 2,276 dps · 3.5s / 484s · 11.8 / 3.2 hits | 2,399 dps · 3.5s / 483s · 9.4 / 1.7 hits | 2,533 dps · 4.3s / 484s · 10.2 / 2 hits | 2,668 dps · 3.8s / 484s · 11.9 / 2.4 hits | 2,804 dps · 5s / 670s · 9 / 1.1 hits |
| Crossbow (Bonk) | 1,667 dps · 4.1s / 473s · 18.3 / 3.1 hits | 1,901 dps · 3.4s / 480s · 15 / 3.6 hits | 2,161 dps · 3.2s / 480s · 16.5 / 4.8 hits | 2,292 dps · 3.4s / 480s · 14.2 / 3.8 hits | 2,418 dps · 3.5s / 479s · 11.3 / 2.1 hits | 2,553 dps · 4.3s / 480s · 12.2 / 2.4 hits | 2,689 dps · 3.8s / 480s · 14.3 / 2.9 hits | 2,846 dps · 4.9s / 660s · 10.6 / 1.3 hits |
| Brain caster: staff spells | 1,543 dps · 4.4s / 511s · 15.1 / 2.5 hits | 1,747 dps · 3.7s / 522s · 12.5 / 3 hits | 1,962 dps · 3.5s / 529s · 13.7 / 4 hits | 2,060 dps · 3.8s / 534s · 11.8 / 3.2 hits | 2,157 dps · 3.9s / 537s · 9.4 / 1.7 hits | 2,254 dps · 4.9s / 544s · 10.2 / 2 hits | 2,352 dps · 4.3s / 548s · 12.1 / 2.4 hits | 2,450 dps · 5.7s / 767s · 9 / 1.1 hits |
| Prayer caster: talisman spells | 1,034 dps · 6.6s / 763s · 15.3 / 2.6 hits | 1,177 dps · 5.5s / 775s · 12.6 / 3 hits | 1,337 dps · 5.1s / 776s · 13.9 / 4.1 hits | 1,411 dps · 5.6s / 780s · 12 / 3.2 hits | 1,486 dps · 5.6s / 779s · 9.5 / 1.8 hits | 1,562 dps · 7s / 785s · 10.3 / 2.1 hits | 1,638 dps · 6.2s / 788s · 12.2 / 2.4 hits | 1,715 dps · 8.1s / 1,096s · 9.1 / 1.1 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 1,459 + weapon 83 · Z2 Meteor, Void Rift, Arcane Beam; spells 1,649 + weapon 97 · Z3 Meteor, Void Rift, Arcane Beam; spells 1,850 + weapon 112 · Z4 Meteor, Void Rift, Arcane Beam; spells 1,939 + weapon 120 · Z5 Meteor, Void Rift, Arcane Beam; spells 2,028 + weapon 129 · Z6 Meteor, Void Rift, Arcane Beam; spells 2,117 + weapon 137 · Z7 Meteor, Void Rift, Arcane Beam; spells 2,206 + weapon 147 · Z8 Meteor, Void Rift, Arcane Beam; spells 2,294 + weapon 156
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 503 + weapon 531 · Z2 Sunray, Purify; spells 568 + weapon 609 · Z3 Sunray, Purify; spells 637 + weapon 699 · Z4 Sunray, Purify; spells 668 + weapon 743 · Z5 Sunray, Purify; spells 698 + weapon 787 · Z6 Sunray, Purify; spells 729 + weapon 833 · Z7 Sunray, Purify; spells 760 + weapon 879 · Z8 Sunray, Purify; spells 790 + weapon 925

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 481 | 218 | 763 | 3.5 |
| 2 | 480 | 221 | 775 | 3.5 |
| 3 | 480 | 221 | 776 | 3.5 |
| 4 | 480 | 221 | 780 | 3.5 |
| 5 | 479 | 221 | 779 | 3.5 |
| 6 | 480 | 221 | 785 | 3.5 |
| 7 | 480 | 221 | 788 | 3.6 |
| 8 | 660 | 304 | 1,096 | 3.6 |

### NG+3

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 6,953 dps · 1.9s / 222s · 21.1 / 3.6 hits | 7,720 dps · 1.6s / 223s · 16.4 / 3.9 hits | 8,531 dps · 1.5s / 223s · 17.6 / 5.1 hits | 8,908 dps · 1.6s / 220s · 14.6 / 3.9 hits | 9,289 dps · 1.6s / 215s · 11.1 / 2.1 hits | 9,648 dps · 1.9s / 212s · 11.7 / 2.3 hits | 10,036 dps · 1.6s / 208s · 13.4 / 2.7 hits | 10,427 dps · 2.1s / 282s · 9.5 / 1.2 hits |
| Slicey: twin daggers | 3,703 dps · 3.6s / 416s · 18.5 / 3.1 hits | 4,112 dps · 3s / 418s · 14.4 / 3.5 hits | 4,556 dps · 2.8s / 418s · 15.4 / 4.5 hits | 4,758 dps · 2.9s / 412s · 12.8 / 3.4 hits | 4,963 dps · 2.9s / 403s · 9.8 / 1.8 hits | 5,156 dps · 3.6s / 398s · 10.3 / 2 hits | 5,364 dps · 3s / 389s · 11.8 / 2.4 hits | 5,586 dps · 3.9s / 526s · 8.4 / 1 hits |
| Quality: longsword + shield | 4,708 dps · 2.8s / 327s · 22.8 / 3.9 hits | 5,449 dps · 2.2s / 315s · 17.8 / 4.3 hits | 6,230 dps · 2s / 305s · 19 / 5.6 hits | 6,778 dps · 2.1s / 289s · 15.8 / 4.2 hits | 7,241 dps · 2s / 276s · 12 / 2.2 hits | 7,553 dps · 2.4s / 271s · 12.7 / 2.5 hits | 7,855 dps · 2.1s / 265s · 14.5 / 2.9 hits | 8,160 dps · 2.7s / 360s · 10.3 / 1.2 hits |
| Bow (Slicey) | 3,139 dps · 4.3s / 491s · 18.5 / 3.1 hits | 3,511 dps · 3.5s / 489s · 14.4 / 3.5 hits | 3,879 dps · 3.2s / 491s · 15.4 / 4.5 hits | 4,050 dps · 3.5s / 484s · 12.8 / 3.4 hits | 4,223 dps · 3.4s / 473s · 9.8 / 1.8 hits | 4,386 dps · 4.2s / 467s · 10.3 / 2 hits | 4,562 dps · 3.6s / 457s · 11.8 / 2.4 hits | 4,739 dps · 4.6s / 621s · 8.4 / 1 hits |
| Crossbow (Bonk) | 3,167 dps · 4.2s / 486s · 21.1 / 3.6 hits | 3,517 dps · 3.5s / 488s · 16.4 / 3.9 hits | 3,887 dps · 3.2s / 490s · 17.6 / 5.1 hits | 4,099 dps · 3.4s / 478s · 14.6 / 3.9 hits | 4,275 dps · 3.4s / 467s · 11.1 / 2.1 hits | 4,441 dps · 4.1s / 462s · 11.7 / 2.3 hits | 4,620 dps · 3.5s / 451s · 13.4 / 2.7 hits | 4,801 dps · 4.5s / 613s · 9.5 / 1.2 hits |
| Brain caster: staff spells | 2,714 dps · 4.9s / 568s · 18.5 / 3.1 hits | 2,988 dps · 4.1s / 575s · 14.4 / 3.5 hits | 3,275 dps · 3.8s / 581s · 15.4 / 4.5 hits | 3,395 dps · 4.1s / 578s · 12.8 / 3.4 hits | 3,512 dps · 4.1s / 569s · 9.8 / 1.8 hits | 3,631 dps · 5.1s / 565s · 10.3 / 2 hits | 3,749 dps · 4.4s / 556s · 11.8 / 2.4 hits | 3,867 dps · 5.6s / 760s · 8.4 / 1 hits |
| Prayer caster: talisman spells | 1,925 dps · 7s / 800s · 18.5 / 3.1 hits | 2,130 dps · 5.7s / 806s · 14.4 / 3.5 hits | 2,345 dps · 5.3s / 811s · 15.4 / 4.5 hits | 2,448 dps · 5.7s / 801s · 12.8 / 3.4 hits | 2,544 dps · 5.7s / 786s · 9.8 / 1.8 hits | 2,641 dps · 6.9s / 776s · 10.3 / 2 hits | 2,739 dps · 6s / 761s · 11.8 / 2.4 hits | 2,838 dps · 7.7s / 1,036s · 8.4 / 1 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 2,535 + weapon 179 · Z2 Meteor, Void Rift, Arcane Beam; spells 2,787 + weapon 201 · Z3 Meteor, Void Rift, Arcane Beam; spells 3,051 + weapon 225 · Z4 Meteor, Void Rift, Arcane Beam; spells 3,156 + weapon 238 · Z5 Meteor, Void Rift, Arcane Beam; spells 3,262 + weapon 250 · Z6 Meteor, Void Rift, Arcane Beam; spells 3,368 + weapon 263 · Z7 Meteor, Void Rift, Arcane Beam; spells 3,473 + weapon 275 · Z8 Meteor, Void Rift, Arcane Beam; spells 3,579 + weapon 288
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 873 + weapon 1,052 · Z2 Sunray, Purify; spells 960 + weapon 1,170 · Z3 Sunray, Purify; spells 1,051 + weapon 1,295 · Z4 Sunray, Purify; spells 1,087 + weapon 1,361 · Z5 Sunray, Purify; spells 1,123 + weapon 1,421 · Z6 Sunray, Purify; spells 1,160 + weapon 1,481 · Z7 Sunray, Purify; spells 1,196 + weapon 1,543 · Z8 Sunray, Purify; spells 1,233 + weapon 1,605

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 486 | 222 | 800 | 3.6 |
| 2 | 488 | 223 | 806 | 3.6 |
| 3 | 490 | 223 | 811 | 3.6 |
| 4 | 478 | 220 | 801 | 3.6 |
| 5 | 467 | 215 | 786 | 3.7 |
| 6 | 462 | 212 | 776 | 3.7 |
| 7 | 451 | 208 | 761 | 3.7 |
| 8 | 613 | 282 | 1,036 | 3.7 |

### NG+4

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 11,430 dps · 1.8s / 212s · 22.8 / 3.9 hits | 12,422 dps · 1.5s / 218s · 17.6 / 4.2 hits | 13,488 dps · 1.5s / 223s · 18.5 / 5.4 hits | 13,861 dps · 1.6s / 223s · 15.3 / 4.1 hits | 14,233 dps · 1.6s / 222s · 11.5 / 2.1 hits | 14,605 dps · 2s / 222s · 12.1 / 2.4 hits | 14,978 dps · 1.7s / 220s · 13.8 / 2.8 hits | 15,350 dps · 2.2s / 302s · 9.7 / 1.2 hits |
| Slicey: twin daggers | 6,124 dps · 3.4s / 396s · 20.1 / 3.4 hits | 6,656 dps · 2.9s / 407s · 15.5 / 3.7 hits | 7,177 dps · 2.8s / 419s · 16.3 / 4.8 hits | 7,375 dps · 3s / 420s · 13.4 / 3.6 hits | 7,573 dps · 3s / 417s · 10.1 / 1.9 hits | 7,771 dps · 3.7s / 416s · 10.6 / 2.1 hits | 7,969 dps · 3.2s / 413s · 12.1 / 2.4 hits | 8,167 dps · 4.2s / 568s · 8.5 / 1 hits |
| Quality: longsword + shield | 8,922 dps · 2.4s / 272s · 24.7 / 4.2 hits | 9,696 dps · 2s / 279s · 19 / 4.6 hits | 10,478 dps · 1.9s / 287s · 20 / 5.9 hits | 10,767 dps · 2.1s / 287s · 16.5 / 4.4 hits | 11,057 dps · 2.1s / 285s · 12.5 / 2.3 hits | 11,346 dps · 2.6s / 285s · 13 / 2.6 hits | 11,635 dps · 2.2s / 283s · 14.9 / 3 hits | 11,924 dps · 2.9s / 389s · 10.5 / 1.3 hits |
| Bow (Slicey) | 5,193 dps · 4.1s / 467s · 20.1 / 3.4 hits | 5,643 dps · 3.4s / 480s · 15.5 / 3.7 hits | 6,141 dps · 3.2s / 489s · 16.3 / 4.8 hits | 6,353 dps · 3.5s / 487s · 13.4 / 3.6 hits | 6,524 dps · 3.5s / 484s · 10.1 / 1.9 hits | 6,694 dps · 4.3s / 483s · 10.6 / 2.1 hits | 6,865 dps · 3.8s / 480s · 12.1 / 2.4 hits | 7,036 dps · 4.9s / 660s · 8.5 / 1 hits |
| Crossbow (Bonk) | 5,264 dps · 4s / 460s · 22.8 / 3.9 hits | 5,722 dps · 3.3s / 473s · 17.6 / 4.2 hits | 6,214 dps · 3.2s / 483s · 18.5 / 5.4 hits | 6,386 dps · 3.5s / 485s · 15.3 / 4.1 hits | 6,558 dps · 3.5s / 481s · 11.5 / 2.1 hits | 6,729 dps · 4.3s / 481s · 12.1 / 2.4 hits | 6,901 dps · 3.7s / 477s · 13.8 / 2.8 hits | 7,072 dps · 4.9s / 656s · 9.7 / 1.2 hits |
| Brain caster: staff spells | 4,202 dps · 5s / 577s · 20.1 / 3.4 hits | 4,545 dps · 4.2s / 596s · 15.5 / 3.7 hits | 4,906 dps · 4s / 612s · 16.3 / 4.8 hits | 5,048 dps · 4.4s / 613s · 13.4 / 3.6 hits | 5,186 dps · 4.4s / 608s · 10.1 / 1.9 hits | 5,325 dps · 5.4s / 608s · 10.6 / 2.1 hits | 5,464 dps · 4.7s / 602s · 12.1 / 2.4 hits | 5,606 dps · 6.1s / 828s · 8.5 / 1 hits |
| Prayer caster: talisman spells | 3,102 dps · 6.8s / 781s · 20.1 / 3.4 hits | 3,362 dps · 5.7s / 805s · 15.5 / 3.7 hits | 3,661 dps · 5.4s / 821s · 16.3 / 4.8 hits | 3,788 dps · 5.8s / 817s · 13.4 / 3.6 hits | 3,907 dps · 5.8s / 808s · 10.1 / 1.9 hits | 4,026 dps · 7.2s / 804s · 10.6 / 2.1 hits | 4,146 dps · 6.2s / 794s · 12.1 / 2.4 hits | 4,276 dps · 8s / 1,086s · 8.5 / 1 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 3,882 + weapon 319 · Z2 Meteor, Void Rift, Arcane Beam; spells 4,197 + weapon 348 · Z3 Meteor, Void Rift, Arcane Beam; spells 4,523 + weapon 384 · Z4 Meteor, Void Rift, Arcane Beam; spells 4,645 + weapon 402 · Z5 Meteor, Void Rift, Arcane Beam; spells 4,768 + weapon 418 · Z6 Meteor, Void Rift, Arcane Beam; spells 4,891 + weapon 434 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,014 + weapon 451 · Z8 Meteor, Void Rift, Arcane Beam; spells 5,136 + weapon 470
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,337 + weapon 1,765 · Z2 Sunray, Purify; spells 1,445 + weapon 1,917 · Z3 Sunray, Purify; spells 1,558 + weapon 2,104 · Z4 Sunray, Purify; spells 1,600 + weapon 2,188 · Z5 Sunray, Purify; spells 1,642 + weapon 2,265 · Z6 Sunray, Purify; spells 1,684 + weapon 2,342 · Z7 Sunray, Purify; spells 1,727 + weapon 2,420 · Z8 Sunray, Purify; spells 1,769 + weapon 2,507

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 460 | 212 | 781 | 3.7 |
| 2 | 473 | 218 | 805 | 3.7 |
| 3 | 483 | 223 | 821 | 3.7 |
| 4 | 485 | 223 | 817 | 3.7 |
| 5 | 481 | 222 | 808 | 3.6 |
| 6 | 481 | 222 | 804 | 3.6 |
| 7 | 477 | 220 | 794 | 3.6 |
| 8 | 656 | 302 | 1,086 | 3.6 |

### NG+5

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 15,723 dps · 1.6s / 185s · 26.8 / 4.6 hits | 16,095 dps · 1.4s / 202s · 19.6 / 4.7 hits | 16,467 dps · 1.5s / 220s · 19.5 / 5.7 hits | 16,840 dps · 1.6s / 222s · 16 / 4.3 hits | 17,212 dps · 1.6s / 221s · 12 / 2.2 hits | 17,584 dps · 2s / 222s · 12.5 / 2.5 hits | 17,957 dps · 1.7s / 221s · 14.3 / 2.9 hits | 18,329 dps · 2.3s / 306s · 10 / 1.2 hits |
| Slicey: twin daggers | 8,365 dps · 3s / 347s · 23.5 / 4 hits | 8,564 dps · 2.7s / 380s · 17.2 / 4.1 hits | 8,762 dps · 2.7s / 414s · 17.2 / 5 hits | 8,960 dps · 3s / 417s · 14.1 / 3.8 hits | 9,158 dps · 3s / 416s · 10.5 / 2 hits | 9,356 dps · 3.7s / 418s · 11 / 2.2 hits | 9,554 dps · 3.3s / 416s · 12.6 / 2.5 hits | 9,752 dps · 4.2s / 575s · 8.7 / 1.1 hits |
| Quality: longsword + shield | 12,214 dps · 2.1s / 238s · 29 / 4.9 hits | 12,503 dps · 1.8s / 260s · 21.2 / 5.1 hits | 12,792 dps · 1.9s / 284s · 21.1 / 6.2 hits | 13,081 dps · 2s / 286s · 17.3 / 4.7 hits | 13,371 dps · 2.1s / 285s · 13 / 2.4 hits | 13,660 dps · 2.6s / 286s · 13.5 / 2.7 hits | 13,949 dps · 2.2s / 285s · 15.4 / 3.1 hits | 14,239 dps · 2.9s / 394s · 10.8 / 1.3 hits |
| Bow (Slicey) | 7,207 dps · 3.5s / 403s · 23.5 / 4 hits | 7,377 dps · 3.1s / 441s · 17.2 / 4.1 hits | 7,548 dps · 3.2s / 481s · 17.2 / 5 hits | 7,719 dps · 3.5s / 484s · 14.1 / 3.8 hits | 7,889 dps · 3.5s / 483s · 10.5 / 2 hits | 8,060 dps · 4.3s / 485s · 11 / 2.2 hits | 8,231 dps · 3.8s / 483s · 12.6 / 2.5 hits | 8,401 dps · 4.9s / 667s · 8.7 / 1.1 hits |
| Crossbow (Bonk) | 7,244 dps · 3.5s / 401s · 26.8 / 4.6 hits | 7,415 dps · 3.1s / 439s · 19.6 / 4.7 hits | 7,587 dps · 3.2s / 478s · 19.5 / 5.7 hits | 7,759 dps · 3.4s / 482s · 16 / 4.3 hits | 7,930 dps · 3.5s / 480s · 12 / 2.2 hits | 8,102 dps · 4.3s / 482s · 12.5 / 2.5 hits | 8,273 dps · 3.8s / 480s · 14.3 / 2.9 hits | 8,445 dps · 4.9s / 664s · 10 / 1.2 hits |
| Brain caster: staff spells | 5,749 dps · 4.4s / 505s · 23.5 / 4 hits | 5,888 dps · 3.9s / 553s · 17.2 / 4.1 hits | 6,025 dps · 4s / 602s · 17.2 / 5 hits | 6,168 dps · 4.3s / 606s · 14.1 / 3.8 hits | 6,310 dps · 4.4s / 604s · 10.5 / 2 hits | 6,445 dps · 5.4s / 606s · 11 / 2.2 hits | 6,580 dps · 4.7s / 604s · 12.6 / 2.5 hits | 6,715 dps · 6.2s / 835s · 8.7 / 1.1 hits |
| Prayer caster: talisman spells | 4,407 dps · 5.7s / 659s · 23.5 / 4 hits | 4,529 dps · 5.1s / 719s · 17.2 / 4.1 hits | 4,642 dps · 5.1s / 781s · 17.2 / 5 hits | 4,775 dps · 5.6s / 783s · 14.1 / 3.8 hits | 4,890 dps · 5.6s / 779s · 10.5 / 2 hits | 4,995 dps · 7s / 782s · 11 / 2.2 hits | 5,100 dps · 6.1s / 779s · 12.6 / 2.5 hits | 5,205 dps · 8s / 1,077s · 8.7 / 1.1 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 5,259 + weapon 490 · Z2 Meteor, Void Rift, Arcane Beam; spells 5,382 + weapon 507 · Z3 Meteor, Void Rift, Arcane Beam; spells 5,504 + weapon 521 · Z4 Meteor, Void Rift, Arcane Beam; spells 5,627 + weapon 541 · Z5 Meteor, Void Rift, Arcane Beam; spells 5,750 + weapon 561 · Z6 Meteor, Void Rift, Arcane Beam; spells 5,872 + weapon 573 · Z7 Meteor, Void Rift, Arcane Beam; spells 5,995 + weapon 585 · Z8 Meteor, Void Rift, Arcane Beam; spells 6,118 + weapon 597
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 1,811 + weapon 2,595 · Z2 Sunray, Purify; spells 1,853 + weapon 2,675 · Z3 Sunray, Purify; spells 1,896 + weapon 2,747 · Z4 Sunray, Purify; spells 1,938 + weapon 2,837 · Z5 Sunray, Purify; spells 1,980 + weapon 2,909 · Z6 Sunray, Purify; spells 2,022 + weapon 2,972 · Z7 Sunray, Purify; spells 2,065 + weapon 3,035 · Z8 Sunray, Purify; spells 2,107 + weapon 3,098

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 401 | 185 | 659 | 3.6 |
| 2 | 439 | 202 | 719 | 3.6 |
| 3 | 478 | 220 | 781 | 3.5 |
| 4 | 482 | 222 | 783 | 3.5 |
| 5 | 480 | 221 | 779 | 3.5 |
| 6 | 482 | 222 | 782 | 3.5 |
| 7 | 480 | 221 | 779 | 3.5 |
| 8 | 664 | 306 | 1,077 | 3.5 |

### NG+6

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 18,702 dps · 1.6s / 181s · 27.9 / 4.8 hits | 19,074 dps · 1.4s / 199s · 20.3 / 4.9 hits | 19,446 dps · 1.4s / 218s · 20.2 / 5.9 hits | 19,819 dps · 1.6s / 220s · 16.5 / 4.5 hits | 20,191 dps · 1.6s / 220s · 12.3 / 2.3 hits | 20,563 dps · 2s / 222s · 12.8 / 2.5 hits | 20,936 dps · 1.7s / 222s · 14.6 / 3 hits | 21,308 dps · 2.3s / 307s · 10.1 / 1.2 hits |
| Slicey: twin daggers | 9,950 dps · 3s / 341s · 24.5 / 4.2 hits | 10,149 dps · 2.7s / 375s · 17.9 / 4.3 hits | 10,347 dps · 2.7s / 410s · 17.8 / 5.2 hits | 10,545 dps · 3s / 414s · 14.5 / 3.9 hits | 10,743 dps · 3s / 414s · 10.8 / 2 hits | 10,941 dps · 3.7s / 417s · 11.3 / 2.2 hits | 11,139 dps · 3.3s / 417s · 12.8 / 2.6 hits | 11,337 dps · 4.3s / 578s · 8.9 / 1.1 hits |
| Quality: longsword + shield | 14,528 dps · 2s / 233s · 30.2 / 5.2 hits | 14,817 dps · 1.8s / 257s · 22 / 5.3 hits | 15,106 dps · 1.8s / 281s · 21.9 / 6.4 hits | 15,396 dps · 2s / 284s · 17.9 / 4.8 hits | 15,685 dps · 2.1s / 284s · 13.3 / 2.5 hits | 15,974 dps · 2.6s / 286s · 13.8 / 2.8 hits | 16,263 dps · 2.2s / 286s · 15.8 / 3.2 hits | 16,553 dps · 2.9s / 396s · 10.9 / 1.3 hits |
| Bow (Slicey) | 8,572 dps · 3.4s / 395s · 24.5 / 4.2 hits | 8,743 dps · 3.1s / 435s · 17.9 / 4.3 hits | 8,913 dps · 3.1s / 475s · 17.8 / 5.2 hits | 9,084 dps · 3.4s / 481s · 14.5 / 3.9 hits | 9,255 dps · 3.5s / 481s · 10.8 / 2 hits | 9,425 dps · 4.3s / 484s · 11.3 / 2.2 hits | 9,596 dps · 3.8s / 484s · 12.8 / 2.6 hits | 9,767 dps · 5s / 671s · 8.9 / 1.1 hits |
| Crossbow (Bonk) | 8,616 dps · 3.4s / 393s · 27.9 / 4.8 hits | 8,788 dps · 3.1s / 433s · 20.3 / 4.9 hits | 8,959 dps · 3.1s / 473s · 20.2 / 5.9 hits | 9,131 dps · 3.4s / 478s · 16.5 / 4.5 hits | 9,303 dps · 3.5s / 478s · 12.3 / 2.3 hits | 9,474 dps · 4.3s / 482s · 12.8 / 2.5 hits | 9,646 dps · 3.8s / 481s · 14.6 / 3 hits | 9,817 dps · 4.9s / 667s · 10.1 / 1.2 hits |
| Brain caster: staff spells | 6,850 dps · 4.3s / 495s · 24.5 / 4.2 hits | 6,985 dps · 3.9s / 545s · 17.9 / 4.3 hits | 7,119 dps · 3.9s / 595s · 17.8 / 5.2 hits | 7,254 dps · 4.3s / 602s · 14.5 / 3.9 hits | 7,389 dps · 4.4s / 602s · 10.8 / 2 hits | 7,524 dps · 5.4s / 607s · 11.3 / 2.2 hits | 7,659 dps · 4.8s / 606s · 12.8 / 2.6 hits | 7,794 dps · 6.2s / 840s · 8.9 / 1.1 hits |
| Prayer caster: talisman spells | 5,310 dps · 5.5s / 638s · 24.5 / 4.2 hits | 5,416 dps · 5s / 702s · 17.9 / 4.3 hits | 5,521 dps · 5.1s / 768s · 17.8 / 5.2 hits | 5,626 dps · 5.6s / 776s · 14.5 / 3.9 hits | 5,731 dps · 5.6s / 777s · 10.8 / 2 hits | 5,836 dps · 7s / 782s · 11.3 / 2.2 hits | 5,942 dps · 6.1s / 782s · 12.8 / 2.6 hits | 6,047 dps · 8s / 1,083s · 8.9 / 1.1 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 6,241 + weapon 609 · Z2 Meteor, Void Rift, Arcane Beam; spells 6,363 + weapon 621 · Z3 Meteor, Void Rift, Arcane Beam; spells 6,486 + weapon 633 · Z4 Meteor, Void Rift, Arcane Beam; spells 6,609 + weapon 646 · Z5 Meteor, Void Rift, Arcane Beam; spells 6,731 + weapon 658 · Z6 Meteor, Void Rift, Arcane Beam; spells 6,854 + weapon 670 · Z7 Meteor, Void Rift, Arcane Beam; spells 6,977 + weapon 682 · Z8 Meteor, Void Rift, Arcane Beam; spells 7,099 + weapon 694
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,149 + weapon 3,161 · Z2 Sunray, Purify; spells 2,192 + weapon 3,224 · Z3 Sunray, Purify; spells 2,234 + weapon 3,287 · Z4 Sunray, Purify; spells 2,276 + weapon 3,350 · Z5 Sunray, Purify; spells 2,318 + weapon 3,413 · Z6 Sunray, Purify; spells 2,361 + weapon 3,476 · Z7 Sunray, Purify; spells 2,403 + weapon 3,539 · Z8 Sunray, Purify; spells 2,445 + weapon 3,602

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 393 | 181 | 638 | 3.5 |
| 2 | 433 | 199 | 702 | 3.5 |
| 3 | 473 | 218 | 768 | 3.5 |
| 4 | 478 | 220 | 776 | 3.5 |
| 5 | 478 | 220 | 777 | 3.5 |
| 6 | 482 | 222 | 782 | 3.5 |
| 7 | 481 | 222 | 782 | 3.5 |
| 8 | 667 | 307 | 1,083 | 3.5 |

### NG+7

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 21,681 dps · 1.6s / 181s · 29.6 / 5.1 hits | 22,053 dps · 1.4s / 200s · 21.6 / 5.2 hits | 22,425 dps · 1.4s / 219s · 21.4 / 6.3 hits | 22,798 dps · 1.6s / 222s · 17.4 / 4.7 hits | 23,170 dps · 1.6s / 223s · 13 / 2.4 hits | 23,542 dps · 2s / 225s · 13.4 / 2.7 hits | 23,915 dps · 1.8s / 225s · 15.3 / 3.1 hits | 24,287 dps · 2.3s / 313s · 10.6 / 1.3 hits |
| Slicey: twin daggers | 11,536 dps · 3s / 341s · 26 / 4.5 hits | 11,734 dps · 2.7s / 376s · 18.9 / 4.5 hits | 11,932 dps · 2.7s / 412s · 18.8 / 5.5 hits | 12,130 dps · 3s / 417s · 15.3 / 4.1 hits | 12,328 dps · 3s / 418s · 11.4 / 2.1 hits | 12,526 dps · 3.8s / 422s · 11.8 / 2.3 hits | 12,724 dps · 3.3s / 423s · 13.4 / 2.7 hits | 12,922 dps · 4.3s / 587s · 9.3 / 1.1 hits |
| Quality: longsword + shield | 16,842 dps · 2s / 233s · 32 / 5.5 hits | 17,131 dps · 1.8s / 257s · 23.3 / 5.6 hits | 17,420 dps · 1.9s / 282s · 23.1 / 6.8 hits | 17,710 dps · 2s / 286s · 18.8 / 5.1 hits | 17,999 dps · 2.1s / 287s · 14 / 2.6 hits | 18,288 dps · 2.6s / 289s · 14.5 / 2.9 hits | 18,578 dps · 2.3s / 290s · 16.6 / 3.3 hits | 18,867 dps · 3s / 402s · 11.4 / 1.4 hits |
| Bow (Slicey) | 9,937 dps · 3.4s / 395s · 26 / 4.5 hits | 10,108 dps · 3.1s / 436s · 18.9 / 4.5 hits | 10,279 dps · 3.1s / 478s · 18.8 / 5.5 hits | 10,449 dps · 3.5s / 484s · 15.3 / 4.1 hits | 10,620 dps · 3.5s / 486s · 11.4 / 2.1 hits | 10,791 dps · 4.4s / 490s · 11.8 / 2.3 hits | 10,962 dps · 3.9s / 491s · 13.4 / 2.7 hits | 11,132 dps · 5s / 682s · 9.3 / 1.1 hits |
| Crossbow (Bonk) | 9,989 dps · 3.4s / 393s · 29.6 / 5.1 hits | 10,160 dps · 3.1s / 434s · 21.6 / 5.2 hits | 10,332 dps · 3.1s / 475s · 21.4 / 6.3 hits | 10,504 dps · 3.4s / 482s · 17.4 / 4.7 hits | 10,675 dps · 3.5s / 483s · 13 / 2.4 hits | 10,847 dps · 4.4s / 488s · 13.4 / 2.7 hits | 11,018 dps · 3.8s / 488s · 15.3 / 3.1 hits | 11,190 dps · 5s / 678s · 10.6 / 1.3 hits |
| Brain caster: staff spells | 7,928 dps · 4.3s / 496s · 26 / 4.5 hits | 8,063 dps · 3.9s / 547s · 18.9 / 4.5 hits | 8,198 dps · 3.9s / 599s · 18.8 / 5.5 hits | 8,333 dps · 4.3s / 607s · 15.3 / 4.1 hits | 8,468 dps · 4.4s / 609s · 11.4 / 2.1 hits | 8,602 dps · 5.5s / 615s · 11.8 / 2.3 hits | 8,738 dps · 4.8s / 616s · 13.4 / 2.7 hits | 8,872 dps · 6.3s / 855s · 9.3 / 1.1 hits |
| Prayer caster: talisman spells | 6,152 dps · 5.6s / 639s · 26 / 4.5 hits | 6,257 dps · 5s / 705s · 18.9 / 4.5 hits | 6,363 dps · 5.1s / 772s · 18.8 / 5.5 hits | 6,468 dps · 5.6s / 782s · 15.3 / 4.1 hits | 6,573 dps · 5.7s / 785s · 11.4 / 2.1 hits | 6,678 dps · 7.1s / 792s · 11.8 / 2.3 hits | 6,783 dps · 6.2s / 793s · 13.4 / 2.7 hits | 6,888 dps · 8.1s / 1,102s · 9.3 / 1.1 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 7,222 + weapon 706 · Z2 Meteor, Void Rift, Arcane Beam; spells 7,345 + weapon 718 · Z3 Meteor, Void Rift, Arcane Beam; spells 7,468 + weapon 730 · Z4 Meteor, Void Rift, Arcane Beam; spells 7,590 + weapon 743 · Z5 Meteor, Void Rift, Arcane Beam; spells 7,713 + weapon 755 · Z6 Meteor, Void Rift, Arcane Beam; spells 7,836 + weapon 767 · Z7 Meteor, Void Rift, Arcane Beam; spells 7,959 + weapon 779 · Z8 Meteor, Void Rift, Arcane Beam; spells 8,081 + weapon 791
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 2,487 + weapon 3,665 · Z2 Sunray, Purify; spells 2,530 + weapon 3,728 · Z3 Sunray, Purify; spells 2,572 + weapon 3,791 · Z4 Sunray, Purify; spells 2,614 + weapon 3,854 · Z5 Sunray, Purify; spells 2,656 + weapon 3,917 · Z6 Sunray, Purify; spells 2,699 + weapon 3,980 · Z7 Sunray, Purify; spells 2,741 + weapon 4,042 · Z8 Sunray, Purify; spells 2,783 + weapon 4,105

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 393 | 181 | 639 | 3.5 |
| 2 | 434 | 200 | 705 | 3.5 |
| 3 | 475 | 219 | 772 | 3.5 |
| 4 | 482 | 222 | 782 | 3.5 |
| 5 | 483 | 223 | 785 | 3.5 |
| 6 | 488 | 225 | 792 | 3.5 |
| 7 | 488 | 225 | 793 | 3.5 |
| 8 | 678 | 313 | 1,102 | 3.5 |

### NG+10

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 30,618 dps · 1.8s / 212s · 12 / 2.1 hits | 30,990 dps · 1.7s / 235s · 8.7 / 2.1 hits | 31,362 dps · 1.7s / 259s · 8.6 / 2.5 hits | 31,735 dps · 1.9s / 263s · 7 / 1.9 hits | 32,107 dps · 1.9s / 265s · 5.1 / 1 hits ⚠1-shot | 32,479 dps · 2.4s / 269s · 5.3 / 1.1 hits | 32,852 dps · 2.1s / 270s · 6 / 1.2 hits | 33,224 dps · 2.8s / 377s · 4.1 / 0.5 hits ⚠1-shot |
| Slicey: twin daggers | 16,291 dps · 3.5s / 398s · 10.5 / 1.8 hits | 16,489 dps · 3.1s / 441s · 7.6 / 1.8 hits | 16,687 dps · 3.2s / 486s · 7.5 / 2.2 hits | 16,885 dps · 3.5s / 495s · 6.1 / 1.6 hits | 17,083 dps · 3.6s / 498s · 4.5 / 0.8 hits ⚠1-shot | 17,281 dps · 4.5s / 505s · 4.7 / 0.9 hits ⚠1-shot | 17,479 dps · 4s / 508s · 5.3 / 1.1 hits | 17,678 dps · 5.2s / 709s · 3.6 / 0.4 hits ⚠1-shot |
| Quality: longsword + shield | 23,784 dps · 2.4s / 273s · 13 / 2.2 hits | 24,074 dps · 2.1s / 302s · 9.4 / 2.3 hits | 24,363 dps · 2.2s / 333s · 9.3 / 2.7 hits | 24,652 dps · 2.4s / 339s · 7.5 / 2 hits | 24,941 dps · 2.5s / 341s · 5.6 / 1 hits | 25,231 dps · 3.1s / 346s · 5.7 / 1.1 hits | 25,520 dps · 2.7s / 348s · 6.5 / 1.3 hits | 25,809 dps · 3.6s / 485s · 4.5 / 0.5 hits ⚠1-shot |
| Bow (Slicey) | 14,034 dps · 4s / 462s · 10.5 / 1.8 hits | 14,204 dps · 3.6s / 512s · 7.6 / 1.8 hits | 14,375 dps · 3.7s / 564s · 7.5 / 2.2 hits | 14,546 dps · 4.1s / 574s · 6.1 / 1.6 hits | 14,717 dps · 4.2s / 579s · 4.5 / 0.8 hits ⚠1-shot | 14,887 dps · 5.2s / 587s · 4.7 / 0.9 hits ⚠1-shot | 15,058 dps · 4.6s / 590s · 5.3 / 1.1 hits | 15,229 dps · 6.1s / 823s · 3.6 / 0.4 hits ⚠1-shot |
| Crossbow (Bonk) | 14,106 dps · 4s / 460s · 12 / 2.1 hits | 14,278 dps · 3.6s / 510s · 8.7 / 2.1 hits | 14,450 dps · 3.7s / 561s · 8.6 / 2.5 hits | 14,621 dps · 4.1s / 571s · 7 / 1.9 hits | 14,793 dps · 4.2s / 576s · 5.1 / 1 hits ⚠1-shot | 14,964 dps · 5.2s / 583s · 5.3 / 1.1 hits | 15,136 dps · 4.6s / 587s · 6 / 1.2 hits | 15,307 dps · 6.1s / 818s · 4.1 / 0.5 hits ⚠1-shot |
| Brain caster: staff spells | 11,164 dps · 5s / 581s · 10.5 / 1.8 hits | 11,299 dps · 4.6s / 644s · 7.6 / 1.8 hits | 11,434 dps · 4.7s / 709s · 7.5 / 2.2 hits | 11,569 dps · 5.2s / 722s · 6.1 / 1.6 hits | 11,704 dps · 5.3s / 727s · 4.5 / 0.8 hits ⚠1-shot | 11,839 dps · 6.6s / 738s · 4.7 / 0.9 hits ⚠1-shot | 11,974 dps · 5.8s / 742s · 5.3 / 1.1 hits | 12,108 dps · 7.6s / 1,035s · 3.6 / 0.4 hits ⚠1-shot |
| Prayer caster: talisman spells | 8,677 dps · 6.5s / 747s · 10.5 / 1.8 hits | 8,782 dps · 5.9s / 829s · 7.6 / 1.8 hits | 8,887 dps · 6s / 912s · 7.5 / 2.2 hits | 8,993 dps · 6.6s / 929s · 6.1 / 1.6 hits | 9,098 dps · 6.8s / 936s · 4.5 / 0.8 hits ⚠1-shot | 9,203 dps · 8.5s / 949s · 4.7 / 0.9 hits ⚠1-shot | 9,308 dps · 7.5s / 954s · 5.3 / 1.1 hits | 9,413 dps · 9.8s / 1,331s · 3.6 / 0.4 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 10,167 + weapon 997 · Z2 Meteor, Void Rift, Arcane Beam; spells 10,290 + weapon 1,009 · Z3 Meteor, Void Rift, Arcane Beam; spells 10,413 + weapon 1,022 · Z4 Meteor, Void Rift, Arcane Beam; spells 10,535 + weapon 1,034 · Z5 Meteor, Void Rift, Arcane Beam; spells 10,658 + weapon 1,046 · Z6 Meteor, Void Rift, Arcane Beam; spells 10,781 + weapon 1,058 · Z7 Meteor, Void Rift, Arcane Beam; spells 10,904 + weapon 1,070 · Z8 Meteor, Void Rift, Arcane Beam; spells 11,026 + weapon 1,082
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 3,502 + weapon 5,175 · Z2 Sunray, Purify; spells 3,544 + weapon 5,238 · Z3 Sunray, Purify; spells 3,586 + weapon 5,301 · Z4 Sunray, Purify; spells 3,628 + weapon 5,364 · Z5 Sunray, Purify; spells 3,671 + weapon 5,427 · Z6 Sunray, Purify; spells 3,713 + weapon 5,490 · Z7 Sunray, Purify; spells 3,755 + weapon 5,553 · Z8 Sunray, Purify; spells 3,797 + weapon 5,616

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 460 | 212 | 747 | 3.5 |
| 2 | 510 | 235 | 829 | 3.5 |
| 3 | 561 | 259 | 912 | 3.5 |
| 4 | 571 | 263 | 929 | 3.5 |
| 5 | 576 | 265 | 936 | 3.5 |
| 6 | 583 | 269 | 949 | 3.5 |
| 7 | 587 | 270 | 954 | 3.5 |
| 8 | 818 | 377 | 1,331 | 3.5 |

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
| Greathammer | S/- | 2H | 652 | 228 | 787 | 48.3 | Earthshaker 151, Meteor Lunge 122, Unstoppable 0 | ⚠ 1.52× median DPS; ⚠ skills 2.24× median |
| Greataxe | A/- | 2H | 600 | 199 | 587 | 41.4 | Cleave Spin 92, Execute 52, Bloodlust 0 |  |
| Colossal Sword | A/E | 2H | 587 | 196 | 599 | 43.1 | Guillotine 108, Stomp 40, Charged Swing 125 | ⚠ skills 2.24× median |
| Crossbow | B/- | 2H | 450 | 150 | 444 | 41.4 | Piercing Bolt 79, Explosive Bolt 48, Rapid Fire 88 |  |
| Club | E/- | 2H | 405 | 151 | 349 | 31.1 | Bonk 79, Wild Swing 38, Tantrum 0 |  |
| Twin Daggers | -/S | 1H | 314 | 108 | 105 | 13.8 | Shadow Step 51, Fan of Knives 13, Flurry 57 |  |
| Rapier | -/A | 1H | 362 | 132 | 184 | 19 | Lunge 51, Riposte Stance 0, Thousand Cuts 55 |  |
| Katana | D/A | 2H | 402 | 149 | 226 | 20.7 | Iai Slash 53, Crescent 32, Blood Moon 0 |  |
| Bow | -/B | 2H | 299 | 113 | 287 | 34.5 | Volley 79, Piercing Shot 40, Rain 15 |  |
| Whip | -/E | 1H | 326 | 140 | 233 | 20.7 | Lash 53, Crack 28, Serpent Coil 55 |  |
| Longsword | B/B | 2H | 426 | 155 | 288 | 25.9 | Shield Breaker 59, Spin Slash 33, Battle Cry 0 |  |
| Spear | C/B | 2H | 393 | 141 | 245 | 24.2 | Impale 59, Sweep 28, Phalanx 0 |  |
| Battleaxe | A/D | 2H | 563 | 194 | 430 | 31.1 | Cleave 83, Hook 37, Frenzy 0 |  |
| Mace | B/E | 2H | 479 | 180 | 416 | 31.1 | Holy Smite 74, Consecrate 40, Judgment 27 |  |
| Halberd | A/C | 2H | 500 | 184 | 401 | 29.3 | Moulinet 102, Hook Pull 35, Vault 44 |  |
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
| First playthrough | 1 | L6 | 34 | 90 | 2.7 | 293 | 22 | 13.1 | 1 | 1 |  |
| First playthrough | 2 | L15 | 52 | 122 | 2.3 | 345 | 22 | 15.5 | 0.88 | 1.18 |  |
| First playthrough | 3 | L26 | 79 | 166 | 2.1 | 398 | 33 | 12.2 | 0.79 | 0.93 |  |
| First playthrough | 4 | L37 | 120 | 217 | 1.8 | 450 | 36 | 12.6 | 0.68 | 0.96 |  |
| First playthrough | 5 | L47 | 171 | 253 | 1.5 | 503 | 43 | 11.8 | 0.56 | 0.9 |  |
| First playthrough | 6 | L57 | 249 | 354 | 1.4 | 555 | 49 | 11.2 | 0.54 | 0.86 |  |
| First playthrough | 7 | L67 | 301 | 351 | 1.2 | 608 | 48 | 12.6 | 0.44 | 0.96 |  |
| First playthrough | 8 | L76 | 350 | 521 | 1.5 | 645 | 52 | 12.3 | 0.56 | 0.94 |  |
| NG+1 | 1 | L87 | 449 | 1,987 | 4.4 | 675 | 46 | 14.8 | 1.67 | 1.13 |  |
| NG+1 | 2 | L100 | 571 | 1,900 | 3.3 | 715 | 65 | 10.9 | 1.25 | 0.83 |  |
| NG+1 | 3 | L113 | 707 | 2,044 | 2.9 | 755 | 65 | 11.7 | 1.09 | 0.89 |  |
| NG+1 | 4 | L125 | 794 | 2,381 | 3 | 795 | 66 | 12 | 1.13 | 0.92 |  |
| NG+1 | 5 | L138 | 895 | 2,581 | 2.9 | 840 | 77 | 10.8 | 1.09 | 0.83 |  |
| NG+1 | 6 | L151 | 994 | 3,420 | 3.4 | 898 | 85 | 10.6 | 1.3 | 0.81 |  |
| NG+1 | 7 | L166 | 1,121 | 3,221 | 2.9 | 956 | 75 | 12.7 | 1.08 | 0.97 |  |
| NG+1 | 8 | L181 | 1,295 | 4,429 | 3.4 | 1,028 | 109 | 9.5 | 1.29 | 0.72 |  |
| NG+2 | 1 | L196 | 1,624 | 6,853 | 4.2 | 1,086 | 74 | 14.7 | 1.59 | 1.12 |  |
| NG+2 | 2 | L210 | 1,989 | 6,456 | 3.2 | 1,144 | 108 | 10.6 | 1.22 | 0.81 |  |
| NG+2 | 3 | L223 | 2,376 | 6,838 | 2.9 | 1,202 | 113 | 10.7 | 1.08 | 0.81 |  |
| NG+2 | 4 | L236 | 2,644 | 7,872 | 3 | 1,260 | 117 | 10.8 | 1.12 | 0.82 |  |
| NG+2 | 5 | L249 | 2,940 | 8,388 | 2.9 | 1,318 | 145 | 9.1 | 1.08 | 0.7 |  |
| NG+2 | 6 | L263 | 3,279 | 10,968 | 3.3 | 1,376 | 160 | 8.6 | 1.26 | 0.66 |  |
| NG+2 | 7 | L279 | 3,648 | 10,117 | 2.8 | 1,449 | 142 | 10.2 | 1.04 | 0.78 |  |
| NG+2 | 8 | L294 | 4,039 | 13,892 | 3.4 | 1,507 | 210 | 7.2 | 1.3 | 0.55 |  |
| NG+3 | 1 | L309 | 4,708 | 13,389 | 2.8 | 1,536 | 87 | 17.6 | 1.07 | 1.34 |  |
| NG+3 | 2 | L323 | 5,449 | 12,160 | 2.2 | 1,536 | 126 | 12.2 | 0.84 | 0.93 |  |
| NG+3 | 3 | L336 | 6,230 | 12,542 | 2 | 1,536 | 131 | 11.7 | 0.76 | 0.9 |  |
| NG+3 | 4 | L350 | 6,778 | 14,026 | 2.1 | 1,536 | 134 | 11.5 | 0.78 | 0.87 |  |
| NG+3 | 5 | L364 | 7,241 | 14,474 | 2 | 1,536 | 165 | 9.3 | 0.75 | 0.71 |  |
| NG+3 | 6 | L379 | 7,553 | 18,345 | 2.4 | 1,536 | 181 | 8.5 | 0.92 | 0.65 |  |
| NG+3 | 7 | L395 | 7,855 | 16,355 | 2.1 | 1,536 | 156 | 9.8 | 0.78 | 0.75 |  |
| NG+3 | 8 | L411 | 8,160 | 21,741 | 2.7 | 1,536 | 233 | 6.6 | 1 | 0.5 |  |
| NG+4 | 1 | L426 | 8,922 | 21,065 | 2.4 | 1,536 | 81 | 19.1 | 0.89 | 1.45 |  |
| NG+4 | 2 | L441 | 9,696 | 19,165 | 2 | 1,536 | 117 | 13.1 | 0.74 | 1 |  |
| NG+4 | 3 | L456 | 10,478 | 19,799 | 1.9 | 1,536 | 124 | 12.4 | 0.71 | 0.94 |  |
| NG+4 | 4 | L470 | 10,767 | 22,141 | 2.1 | 1,536 | 128 | 12 | 0.77 | 0.91 |  |
| NG+4 | 5 | L484 | 11,057 | 22,848 | 2.1 | 1,536 | 159 | 9.6 | 0.78 | 0.74 |  |
| NG+4 | 6 | L499 | 11,346 | 28,958 | 2.6 | 1,536 | 176 | 8.7 | 0.96 | 0.67 |  |
| NG+4 | 7 | L516 | 11,635 | 25,817 | 2.2 | 1,536 | 152 | 10.1 | 0.84 | 0.77 |  |
| NG+4 | 8 | L533 | 11,924 | 34,319 | 2.9 | 1,536 | 230 | 6.7 | 1.08 | 0.51 |  |
| NG+5 | 1 | L550 | 12,214 | 25,221 | 2.1 | 1,536 | 69 | 22.3 | 0.78 | 1.7 |  |
| NG+5 | 2 | L566 | 12,503 | 23,049 | 1.8 | 1,536 | 105 | 14.6 | 0.69 | 1.11 |  |
| NG+5 | 3 | L581 | 12,792 | 23,907 | 1.9 | 1,536 | 118 | 13 | 0.7 | 0.99 |  |
| NG+5 | 4 | L595 | 13,081 | 26,736 | 2 | 1,536 | 122 | 12.6 | 0.77 | 0.96 |  |
| NG+5 | 5 | L609 | 13,371 | 27,590 | 2.1 | 1,536 | 153 | 10.1 | 0.78 | 0.77 |  |
| NG+5 | 6 | L624 | 13,660 | 34,967 | 2.6 | 1,536 | 170 | 9.1 | 0.96 | 0.69 |  |
| NG+5 | 7 | L642 | 13,949 | 31,174 | 2.2 | 1,536 | 146 | 10.5 | 0.84 | 0.8 |  |
| NG+5 | 8 | L659 | 14,239 | 41,441 | 2.9 | 1,536 | 224 | 6.9 | 1.1 | 0.52 |  |
| NG+6 | 1 | L676 | 14,528 | 29,465 | 2 | 1,536 | 66 | 23.3 | 0.76 | 1.78 |  |
| NG+6 | 2 | L693 | 14,817 | 26,927 | 1.8 | 1,536 | 101 | 15.1 | 0.68 | 1.15 |  |
| NG+6 | 3 | L708 | 15,106 | 27,929 | 1.8 | 1,536 | 114 | 13.5 | 0.7 | 1.03 |  |
| NG+6 | 4 | L724 | 15,396 | 31,234 | 2 | 1,536 | 118 | 13 | 0.76 | 0.99 |  |
| NG+6 | 5 | L739 | 15,685 | 32,232 | 2.1 | 1,536 | 149 | 10.3 | 0.77 | 0.79 |  |
| NG+6 | 6 | L756 | 15,974 | 40,850 | 2.6 | 1,536 | 166 | 9.3 | 0.96 | 0.71 |  |
| NG+6 | 7 | L774 | 16,263 | 36,419 | 2.2 | 1,536 | 143 | 10.7 | 0.84 | 0.82 |  |
| NG+6 | 8 | L793 | 16,553 | 48,413 | 2.9 | 1,536 | 220 | 7 | 1.1 | 0.53 |  |
| NG+7 | 1 | L811 | 16,842 | 34,149 | 2 | 1,536 | 62 | 24.7 | 0.76 | 1.88 |  |
| NG+7 | 2 | L828 | 17,131 | 31,208 | 1.8 | 1,536 | 96 | 16 | 0.69 | 1.22 |  |
| NG+7 | 3 | L845 | 17,420 | 32,369 | 1.9 | 1,536 | 108 | 14.2 | 0.7 | 1.09 |  |
| NG+7 | 4 | L861 | 17,710 | 36,200 | 2 | 1,536 | 112 | 13.7 | 0.77 | 1.04 |  |
| NG+7 | 5 | L876 | 17,999 | 37,356 | 2.1 | 1,536 | 142 | 10.8 | 0.78 | 0.83 |  |
| NG+7 | 6 | L893 | 18,288 | 47,345 | 2.6 | 1,536 | 158 | 9.7 | 0.98 | 0.74 |  |
| NG+7 | 7 | L913 | 18,578 | 42,209 | 2.3 | 1,536 | 137 | 11.2 | 0.86 | 0.86 |  |
| NG+7 | 8 | L932 | 18,867 | 56,110 | 3 | 1,536 | 211 | 7.3 | 1.12 | 0.56 |  |
| NG+10 | 1 | L1250 | 23,784 | 56,365 | 2.4 | 1,536 | 154 | 10 | 0.89 | 0.76 |  |
| NG+10 | 2 | L1269 | 24,074 | 51,511 | 2.1 | 1,536 | 238 | 6.5 | 0.81 | 0.49 | ⚠ survives 2× fewer hits |
| NG+10 | 3 | L1287 | 24,363 | 53,428 | 2.2 | 1,536 | 269 | 5.7 | 0.83 | 0.44 | ⚠ survives 2.3× fewer hits |
| NG+10 | 4 | L1305 | 24,652 | 59,750 | 2.4 | 1,536 | 282 | 5.5 | 0.91 | 0.42 | ⚠ survives 2.4× fewer hits |
| NG+10 | 5 | L1323 | 24,941 | 61,658 | 2.5 | 1,536 | 357 | 4.3 | 0.93 | 0.33 | ⚠ survives 3× fewer hits |
| NG+10 | 6 | L1342 | 25,231 | 78,146 | 3.1 | 1,536 | 400 | 3.8 | 1.17 | 0.29 | ⚠ survives 3.4× fewer hits |
| NG+10 | 7 | L1364 | 25,520 | 69,669 | 2.7 | 1,536 | 347 | 4.4 | 1.03 | 0.34 | ⚠ survives 3× fewer hits |
| NG+10 | 8 | L1386 | 25,809 | 92,613 | 3.6 | 1,536 | 540 | 2.8 | 1.35 | 0.22 | ⚠ survives 4.6× fewer hits |

