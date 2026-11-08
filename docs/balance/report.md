# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **One-shots** (severity 6): First playthrough zone 8: The Landlord's biggest hit (Supernova, pierce, 908 void) kills the Bonk: greathammer (2H) build (620 HP) in one hit (0.84). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
2. **One-shots** (severity 6): First playthrough zone 8: The Landlord's biggest hit (Supernova, pierce, 908 void) kills the Crossbow (Bonk) build (620 HP) in one hit (0.84). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
3. **One-shots** (severity 6): NG+1 zone 8: The Landlord's biggest hit (Supernova, pierce, 1,717 void) kills the Bonk: greathammer (2H) build (739 HP) in one hit (0.7). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
4. **Boss length** (severity 5.2): NG+2 zone 8: the median build needs 660 s of nonstop hitting to kill The Landlord (1,286,383 HP), 11 minutes before any dodging. *Suggested:* Trim the boss HP multiplier for this cycle (NG1_HP_MULT / NG_STEPS) or the extra phase bars.
5. **Boss length** (severity 4.6): NG+2 zone 5: the median build needs 481 s of nonstop hitting to kill Foreman Ignatius (809,966 HP), 8 minutes before any dodging. *Suggested:* Trim the boss HP multiplier for this cycle (NG1_HP_MULT / NG_STEPS) or the extra phase bars.
6. **Boss length** (severity 4.6): NG+2 zone 2: the median build needs 481 s of nonstop hitting to kill Mother Spore (639,700 HP), 8 minutes before any dodging. *Suggested:* Trim the boss HP multiplier for this cycle (NG1_HP_MULT / NG_STEPS) or the extra phase bars.
7. **Gems** (severity 4.6): Quicksilver raises sustained DPS by +3% (burst +7%) where Brutal gives +6% (0.41× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
8. **Weapons** (severity 4.6): Club: 79 sustained light-attack DPS, 0.55× the median weapon (143) at equal fitting stats. *Suggested:* Raise its base damage / combo multipliers (D40: poor scaling should mean higher base, not lower DPS).
9. **Weapons** (severity 4.3): Whip: 85 sustained light-attack DPS, 0.59× the median weapon (143) at equal fitting stats. *Suggested:* Raise its base damage / combo multipliers (D40: poor scaling should mean higher base, not lower DPS).
10. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
11. **NG+ levels** (severity 4): NG+2: a full clear buys only about 16 levels (level costs grow ×1.045 a level), while enemies grow ×2.5 in HP and damage; the player's own growth that cycle is nearly all reinforcement. *Suggested:* Flatten the level cost curve past level 80, raise NG+ Shard income, or soften NG_STEPS.
12. **Enemy curve** (severity 3.6): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 106. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
13. **Spells** (severity 3.5): Arcane Beam (brain): 16.4 damage per busy second at Spell Skill 100, 2.05× the brain median (8). *Suggested:* Lengthen its cooldown or lower its base.
14. **Enemy curve** (severity 3.2): NG+1: zone 7 room enemies have 2,573 HP on average, below zone 6's 2,875. *Suggested:* Check the zone roster mix and the HP curve.
15. **Enemy curve** (severity 3.2): NG+2: zone 7 room enemies have 6,433 HP on average, below zone 6's 7,188. *Suggested:* Check the zone roster mix and the HP curve.
16. **Gear power** (severity 3): Reinforcement reaches ×4 at +15, while the whole rarity ladder is ×1.28: a +15 common out-hits a +0 legendary 3.1×, so drops matter little once reinforcement starts. *Suggested:* Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.
17. **Boss curve** (severity 3): NG+1: Mother Spore (zone 2) averages 341 a hit, below zone 1's boss (383). *Suggested:* Raise its phase damage multipliers.
18. **Boss curve** (severity 3): NG+2: Mother Spore (zone 2) averages 853 a hit, below zone 1's boss (958). *Suggested:* Raise its phase damage multipliers.
19. **Enemy curve** (severity 2.9): NG+1: zone 2 room enemies have 1,884 HP on average, below zone 1's 2,058. *Suggested:* Check the zone roster mix and the HP curve.

(20 more findings of the same kinds are in the tables below.)

## 1. Enemies and bosses by zone

Room enemies: each roster enemy spawned with the real spawn code (solo); a hit is `attackDamage` for each attack with a damage multiplier. Bosses: every phase walked with the real phase code; the phase bar is the HP that phase has to lose.

### First playthrough

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 90 | 18–180 | 25 | 8–48 |  |
| 2 | 122 | 28–279 | 29 | 5–70 |  |
| 3 | 166 | 38–378 | 43 | 8–136 |  |
| 4 | 226 | 48–596 | 56 | 5–162 |  |
| 5 | 272 | 58–624 | 72 | 18–152 |  |
| 6 | 391 | 68–945 | 87 | 15–228 |  |
| 7 | 388 | 77–968 | 106 | 30–318 |  |
| 8 | 563 | 87–1,310 | 100 | 19–386 | ⚠ hits softer than zone 7 |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 36 (70) | 51 (109) | 59 (147) | 88 (186) | 98 (224) | 124 (263) | 156 (301) | 97 (340) |
| brute | 39 (180) | 54 (279) | 97 (378) | 131 (477) | 114 (576) | 198 (945) | 262 (774) | 239 (1,310) |
| caster | 28 (55) | 24 (85) | 35 (116) | 57 (146) | 53 (176) | 73 (206) | 92 (237) | 61 (267) |
| fodder | 22 (60) | 23 (102) | 27 (113) | 42 (159) | 56 (211) | 65 (270) | 83 (310) | 75 (378) |
| hazard | 14 (80) | 22 (124) | 48 (218) | 36 (212) | 63 (307) | 70 (300) | 84 (344) | 110 (776) |
| ranged | 18 (50) | 19 (78) | 41 (105) | 43 (133) | 52 (160) | 57 (188) | 84 (323) | 62 (243) |
| support | 17 (55) | 21 (85) | — | 42 (146) | 100 (176) | 42 (206) | 51 (237) | 80 (267) |
| swarm | 8 (18) | 8 (28) | 10 (38) | 9 (48) | 20 (58) | 18 (68) | 35 (77) | 28 (87) |
| tank | 33 (150) | 44 (233) | 57 (315) | 74 (596) | 105 (624) | 113 (731) | 131 (968) | 126 (982) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 2 | 1,260 / 1,260 | 2,520 | 69 / 72 | 118 |  |
| 2 | Mother Spore | 2 | 2,790 / 2,790 | 5,580 | 59 / 90 | 152 |  |
| 3 | The Bloatking | 2 | 3,780 / 3,780 | 7,560 | 86 / 111 | 153 |  |
| 4 | Vexthorn, the Hollow Stag | 2 | 5,486 / 5,486 | 10,971 | 119 / 167 | 241 |  |
| 5 | Foreman Ignatius | 2 | 6,911 / 11,520 | 18,431 | 152 / 220 | 388 |  |
| 6 | Saint Aurelia the Unthawed | 2 | 5,198 / 15,593 | 20,790 | 160 / 243 | 391 |  |
| 7 | Archmagister Tock | 2 | 13,932 / 9,288 | 23,220 | 256 / 388 | 508 |  |
| 8 | The Landlord | 4 | 14,841 / 14,405 / 14,404 / 17,285 | 60,934 | 320 / 408 / 601 / 509 | 908 |  |

### NG+1

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 2,058 | 412–4,125 | 128 | 41–243 |  |
| 2 | 1,884 | 429–4,293 | 225 | 42–549 | ⚠ HP below zone 1 |
| 3 | 1,958 | 446–4,462 | 230 | 43–720 |  |
| 4 | 2,194 | 463–5,788 | 252 | 24–726 |  |
| 5 | 2,269 | 480–5,198 | 265 | 65–560 |  |
| 6 | 2,875 | 497–6,953 | 277 | 48–723 |  |
| 7 | 2,573 | 514–6,419 | 293 | 83–881 | ⚠ HP below zone 6 |
| 8 | 3,421 | 530–7,955 | 312 | 60–1,205 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 185 (1,604) | 399 (1,670) | 311 (1,735) | 395 (1,801) | 361 (1,866) | 394 (1,932) | 433 (1,997) | 301 (2,062) |
| brute | 196 (4,125) | 422 (4,293) | 516 (4,462) | 585 (4,630) | 421 (4,798) | 629 (6,953) | 726 (5,135) | 746 (7,955) |
| caster | 139 (1,260) | 186 (1,312) | 183 (1,363) | 255 (1,415) | 194 (1,466) | 232 (1,518) | 255 (1,569) | 189 (1,621) |
| fodder | 110 (1,375) | 181 (1,574) | 142 (1,338) | 186 (1,543) | 206 (1,759) | 208 (1,987) | 230 (2,054) | 232 (2,298) |
| hazard | 71 (1,833) | 169 (1,908) | 252 (2,578) | 161 (2,058) | 234 (2,559) | 221 (2,207) | 232 (2,282) | 344 (4,714) |
| ranged | 91 (1,146) | 148 (1,193) | 216 (1,239) | 192 (1,286) | 193 (1,333) | 181 (1,380) | 232 (2,140) | 194 (1,473) |
| support | 84 (1,260) | 163 (1,312) | — | 189 (1,415) | 369 (1,466) | 133 (1,518) | 140 (1,569) | 249 (1,621) |
| swarm | 41 (412) | 63 (429) | 50 (446) | 40 (463) | 73 (480) | 56 (497) | 96 (514) | 86 (530) |
| tank | 165 (3,437) | 343 (3,578) | 304 (3,718) | 332 (5,788) | 388 (5,198) | 359 (5,381) | 362 (6,419) | 392 (5,966) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 31,762 / 47,643 / 47,643 | 127,048 | 351 / 367 / 422 | 689 |  |
| 2 | Mother Spore | 3 | 40,357 / 60,535 / 60,535 | 161,428 | 232 / 351 / 404 | 683 | ⚠ hits softer than zone 1's boss |
| 3 | The Bloatking | 3 | 49,301 / 73,952 / 73,952 | 197,205 | 278 / 358 / 412 | 568 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 54,310 / 81,465 / 81,465 | 217,240 | 331 / 464 / 533 | 770 |  |
| 5 | Foreman Ignatius | 3 | 89,249 / 74,375 / 74,375 | 237,999 | 372 / 540 / 621 | 1,097 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 32,316 / 113,106 / 113,106 | 258,529 | 356 / 540 / 621 | 999 |  |
| 7 | Archmagister Tock | 3 | 83,651 / 97,593 / 97,593 | 278,837 | 522 / 790 / 908 | 1,191 |  |
| 8 | The Landlord | 4 | 116,305 / 112,884 / 112,883 / 135,461 | 477,534 | 605 / 770 / 1,136 / 962 | 1,717 |  |

### NG+2

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 5,145 | 1,031–10,312 | 319 | 101–609 |  |
| 2 | 4,711 | 1,073–10,733 | 563 | 106–1,372 | ⚠ HP below zone 1 |
| 3 | 4,895 | 1,115–11,154 | 575 | 108–1,799 |  |
| 4 | 5,485 | 1,158–14,469 | 630 | 60–1,815 |  |
| 5 | 5,671 | 1,200–12,996 | 661 | 163–1,399 |  |
| 6 | 7,188 | 1,242–17,384 | 693 | 121–1,808 |  |
| 7 | 6,433 | 1,284–16,047 | 734 | 209–2,202 | ⚠ HP below zone 6 |
| 8 | 8,552 | 1,326–19,888 | 781 | 151–3,012 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 462 (4,010) | 998 (4,174) | 777 (4,338) | 988 (4,501) | 902 (4,665) | 984 (4,829) | 1,082 (4,992) | 753 (5,156) |
| brute | 490 (10,312) | 1,056 (10,733) | 1,289 (11,154) | 1,462 (11,575) | 1,052 (11,996) | 1,573 (17,384) | 1,816 (12,838) | 1,865 (19,888) |
| caster | 349 (3,151) | 465 (3,280) | 458 (3,408) | 638 (3,537) | 485 (3,665) | 580 (3,794) | 638 (3,923) | 473 (4,051) |
| fodder | 274 (3,437) | 451 (3,936) | 354 (3,346) | 465 (3,858) | 515 (4,399) | 520 (4,967) | 574 (5,135) | 581 (5,745) |
| hazard | 178 (4,583) | 422 (4,770) | 630 (6,445) | 403 (5,144) | 585 (6,398) | 552 (5,519) | 580 (5,706) | 861 (11,786) |
| ranged | 228 (2,865) | 369 (2,981) | 540 (3,098) | 479 (3,215) | 483 (3,332) | 452 (3,449) | 580 (5,349) | 484 (3,683) |
| support | 209 (3,151) | 406 (3,280) | — | 471 (3,537) | 924 (3,665) | 331 (3,794) | 351 (3,923) | 621 (4,051) |
| swarm | 101 (1,031) | 158 (1,073) | 126 (1,115) | 101 (1,158) | 183 (1,200) | 141 (1,242) | 240 (1,284) | 215 (1,326) |
| tank | 412 (8,594) | 858 (8,944) | 760 (9,295) | 830 (14,469) | 970 (12,996) | 898 (13,452) | 904 (16,047) | 979 (14,916) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 139,216 / 208,824 / 208,824 | 556,865 | 879 / 917 / 1,054 | 1,722 |  |
| 2 | Mother Spore | 3 | 159,925 / 239,888 / 239,888 | 639,700 | 579 / 878 / 1,010 | 1,707 | ⚠ hits softer than zone 1's boss |
| 3 | The Bloatking | 3 | 182,370 / 273,555 / 273,555 | 729,480 | 694 / 895 / 1,029 | 1,419 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 192,348 / 288,522 / 288,522 | 769,393 | 828 / 1,159 / 1,333 | 1,924 |  |
| 5 | Foreman Ignatius | 3 | 303,737 / 253,115 / 253,115 | 809,966 | 931 / 1,349 / 1,552 | 2,743 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 106,127 / 371,444 / 371,444 | 849,016 | 889 / 1,350 / 1,552 | 2,498 |  |
| 7 | Archmagister Tock | 3 | 268,053 / 312,728 / 312,728 | 893,509 | 1,304 / 1,974 / 2,270 | 2,977 |  |
| 8 | The Landlord | 4 | 313,303 / 304,088 / 304,087 / 364,906 | 1,286,383 | 1,513 / 1,926 / 2,839 / 2,406 | 4,291 |  |

## 2. Time to kill and hits to die

Each build at the zone's expected level, with points split as listed, wearing its class's armour and its weapon at the zone's item level (no affixes or gems), at the rarity and reinforcement assumed below. **DPS** is sustained light-attack damage per second (swing until the stamina bar is empty, then wait for it to refill); casters cast their three best damaging spells as often as cooldowns, cast time and stamina allow. **TTK** = seconds of that DPS to kill the zone's average room enemy / its boss (all phases). **Hits** = average hits of the zone's room enemies / the boss's biggest hit to kill the build, after its defense.

| Cycle | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First playthrough | L6 · ilvl 1 · uncommon +0 | L15 · ilvl 2 · uncommon +0 | L26 · ilvl 3 · rare +0 | L37 · ilvl 4 · rare +1 | L47 · ilvl 5 · rare +2 | L57 · ilvl 6 · epic +3 | L67 · ilvl 7 · epic +3 | L76 · ilvl 8 · epic +3 |
| NG+1 | L85 · ilvl 9 · epic +4 | L93 · ilvl 10 · epic +5 | L99 · ilvl 11 · epic +6 | L104 · ilvl 12 · epic +6 | L108 · ilvl 13 · epic +6 | L112 · ilvl 14 · epic +6 | L116 · ilvl 15 · epic +6 | L120 · ilvl 16 · epic +6 |
| NG+2 | L123 · ilvl 17 · epic +7 | L125 · ilvl 18 · epic +8 | L127 · ilvl 19 · epic +9 | L129 · ilvl 20 · epic +9 | L130 · ilvl 21 · epic +9 | L132 · ilvl 22 · epic +9 | L134 · ilvl 23 · epic +9 | L136 · ilvl 24 · epic +9 |

### First playthrough

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 41 dps · 2.2s / 62s · 17.5 / 3 hits | 65 dps · 1.9s / 86s · 21.5 / 2.9 hits | 99 dps · 1.7s / 76s · 17.5 / 3.6 hits | 160 dps · 1.4s / 68s · 18.2 / 2.9 hits | 237 dps · 1.2s / 78s · 11 / 1.6 hits | 354 dps · 1.1s / 59s · 11.9 / 1.8 hits | 422 dps · 0.9s / 55s · 14.3 / 2.5 hits | 505 dps · 1.1s / 121s · 11.7 / 0.8 hits ⚠1-shot |
| Slicey: twin daggers | 26 dps · 3.5s / 97s · 13.1 / 2.1 hits | 41 dps · 3s / 135s · 15.7 / 2.1 hits | 63 dps · 2.6s / 119s · 13.2 / 2.6 hits | 104 dps · 2.2s / 106s · 15.7 / 2 hits | 154 dps · 1.8s / 120s · 13.8 / 2 hits | 233 dps · 1.7s / 89s · 16.8 / 2.6 hits | 280 dps · 1.4s / 83s · 12.4 / 1.8 hits | 327 dps · 1.7s / 186s · 18 / 1.4 hits |
| Quality: longsword + shield | 34 dps · 2.7s / 74s · 17.6 / 3 hits | 52 dps · 2.3s / 107s · 22.4 / 3 hits | 79 dps · 2.1s / 96s · 19 / 3.8 hits | 125 dps · 1.8s / 87s · 21.3 / 3.2 hits | 184 dps · 1.5s / 100s · 15.5 / 2.2 hits | 275 dps · 1.4s / 76s · 18.2 / 2.8 hits | 332 dps · 1.2s / 70s · 18.6 / 3 hits | 386 dps · 1.5s / 158s · 18.9 / 1.4 hits |
| Bow (Slicey) | 26 dps · 3.4s / 96s · 12.3 / 2 hits | 41 dps · 3s / 137s · 14.9 / 2 hits | 61 dps · 2.7s / 124s · 12.6 / 2.4 hits | 101 dps · 2.2s / 109s · 15 / 2 hits | 148 dps · 1.8s / 124s · 13.3 / 2 hits | 221 dps · 1.8s / 94s · 16.2 / 2.5 hits | 263 dps · 1.5s / 88s · 12.1 / 1.7 hits | 305 dps · 1.8s / 200s · 17.6 / 1.4 hits |
| Crossbow (Bonk) | 27 dps · 3.3s / 92s · 17.5 / 3 hits | 43 dps · 2.9s / 131s · 21.5 / 2.9 hits | 63 dps · 2.6s / 119s · 17.5 / 3.6 hits | 101 dps · 2.2s / 109s · 18.2 / 2.9 hits | 153 dps · 1.8s / 121s · 11 / 1.6 hits | 228 dps · 1.7s / 91s · 11.9 / 1.8 hits | 270 dps · 1.4s / 86s · 14.3 / 2.5 hits | 313 dps · 1.8s / 195s · 11.7 / 0.8 hits ⚠1-shot |
| Brain caster: staff spells | 37 dps · 2.4s / 68s · 12.3 / 2 hits | 63 dps · 1.9s / 88s · 14.9 / 2 hits | 95 dps · 1.7s / 79s · 12.6 / 2.4 hits | 144 dps · 1.6s / 76s · 15 / 2 hits | 204 dps · 1.3s / 90s · 13.3 / 2 hits | 295 dps · 1.3s / 70s · 16.2 / 2.5 hits | 342 dps · 1.1s / 68s · 12.1 / 1.7 hits | 388 dps · 1.5s / 157s · 17.6 / 1.4 hits |
| Prayer caster: talisman spells | 37 dps · 2.4s / 69s · 13.6 / 2.3 hits | 33 dps · 3.7s / 167s · 17.4 / 2.4 hits | 49 dps · 3.4s / 155s · 14.8 / 3 hits | 77 dps · 3s / 143s · 16.7 / 2.5 hits | 110 dps · 2.5s / 167s · 12.1 / 1.7 hits | 162 dps · 2.4s / 128s · 14.3 / 2.2 hits | 191 dps · 2s / 122s · 14.6 / 2.4 hits | 219 dps · 2.6s / 278s · 15.2 / 1.1 hits |

- Brain caster: staff spells: Z1 Void Rift, Frost Lance, Fireball; spells 33 + weapon 4 · Z2 Void Rift, Arcane Beam, Frost Lance; spells 61 + weapon 3 · Z3 Meteor, Void Rift, Arcane Beam; spells 90 + weapon 5 · Z4 Meteor, Void Rift, Arcane Beam; spells 136 + weapon 8 · Z5 Meteor, Void Rift, Arcane Beam; spells 192 + weapon 12 · Z6 Meteor, Void Rift, Arcane Beam; spells 277 + weapon 18 · Z7 Meteor, Void Rift, Arcane Beam; spells 321 + weapon 21 · Z8 Meteor, Void Rift, Arcane Beam; spells 363 + weapon 25
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 13 + weapon 23 · Z2 Sunray, Purify; spells 19 + weapon 14 · Z3 Sunray, Purify; spells 27 + weapon 22 · Z4 Sunray, Purify; spells 42 + weapon 35 · Z5 Sunray, Purify; spells 59 + weapon 51 · Z6 Sunray, Purify; spells 86 + weapon 76 · Z7 Sunray, Purify; spells 101 + weapon 90 · Z8 Sunray, Purify; spells 114 + weapon 105

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
| Bonk: greathammer (2H) | 650 dps · 3.2s / 196s · 14.2 / 2.4 hits | 815 dps · 2.3s / 198s · 11.9 / 2.9 hits | 992 dps · 2s / 199s · 13.4 / 4.1 hits | 1,087 dps · 2s / 200s · 12.6 / 3.2 hits | 1,174 dps · 1.9s / 203s · 6.4 / 1.1 hits | 1,263 dps · 2.3s / 205s · 7.1 / 1.3 hits | 1,352 dps · 1.9s / 206s · 11.9 / 2.6 hits | 1,435 dps · 2.4s / 333s · 6.3 / 0.7 hits ⚠1-shot |
| Slicey: twin daggers | 424 dps · 4.9s / 300s · 13.5 / 1.8 hits | 537 dps · 3.5s / 301s · 9.2 / 2.1 hits | 657 dps · 3s / 300s · 11 / 2.9 hits | 725 dps · 3s / 300s · 13.4 / 2.3 hits | 791 dps · 2.9s / 301s · 13.6 / 2.6 hits | 858 dps · 3.4s / 301s · 15.8 / 3.1 hits | 927 dps · 2.8s / 301s · 11.2 / 1.8 hits | 996 dps · 3.4s / 479s · 13.7 / 1.8 hits |
| Quality: longsword + shield | 500 dps · 4.1s / 254s · 19.7 / 3.1 hits | 636 dps · 3s / 254s · 15.7 / 3.8 hits | 778 dps · 2.5s / 253s · 18.3 / 5.3 hits | 859 dps · 2.6s / 253s · 19 / 4.2 hits | 934 dps · 2.4s / 255s · 13.5 / 2.5 hits | 1,014 dps · 2.8s / 255s · 15.4 / 2.9 hits | 1,097 dps · 2.3s / 254s · 17.4 / 3.4 hits | 1,181 dps · 2.9s / 404s · 13.5 / 1.6 hits |
| Bow (Slicey) | 400 dps · 5.1s / 317s · 13.3 / 1.8 hits | 503 dps · 3.7s / 321s · 9 / 2 hits | 613 dps · 3.2s / 322s · 10.8 / 2.8 hits | 675 dps · 3.3s / 322s · 13.3 / 2.3 hits | 732 dps · 3.1s / 325s · 13.4 / 2.6 hits | 794 dps · 3.6s / 326s · 15.6 / 3 hits | 856 dps · 3s / 326s · 11 / 1.8 hits | 918 dps · 3.7s / 520s · 13.5 / 1.8 hits |
| Crossbow (Bonk) | 403 dps · 5.1s / 316s · 14.2 / 2.4 hits | 505 dps · 3.7s / 320s · 11.9 / 2.9 hits | 616 dps · 3.2s / 320s · 13.4 / 4.1 hits | 691 dps · 3.2s / 315s · 12.6 / 3.2 hits | 749 dps · 3s / 318s · 6.4 / 1.1 hits | 812 dps · 3.5s / 319s · 7.1 / 1.3 hits | 875 dps · 2.9s / 319s · 11.9 / 2.6 hits | 938 dps · 3.6s / 509s · 6.3 / 0.7 hits ⚠1-shot |
| Brain caster: staff spells | 490 dps · 4.2s / 259s · 13.3 / 1.8 hits | 604 dps · 3.1s / 267s · 9 / 2 hits | 728 dps · 2.7s / 271s · 10.8 / 2.8 hits | 792 dps · 2.8s / 274s · 13.3 / 2.3 hits | 853 dps · 2.7s / 279s · 13.4 / 2.6 hits | 917 dps · 3.1s / 282s · 15.6 / 3 hits | 981 dps · 2.6s / 284s · 11 / 1.8 hits | 1,047 dps · 3.3s / 456s · 13.5 / 1.8 hits |
| Prayer caster: talisman spells | 282 dps · 7.3s / 451s · 15.8 / 2.5 hits | 351 dps · 5.4s / 460s · 12.7 / 3 hits | 426 dps · 4.6s / 463s · 14.8 / 4.3 hits | 466 dps · 4.7s / 466s · 15.3 / 3.4 hits | 504 dps · 4.5s / 472s · 10.9 / 2 hits | 544 dps · 5.3s / 475s · 12.4 / 2.4 hits | 585 dps · 4.4s / 477s · 14 / 2.8 hits | 625 dps · 5.5s / 764s · 10.8 / 1.3 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 458 + weapon 31 · Z2 Meteor, Void Rift, Arcane Beam; spells 565 + weapon 39 · Z3 Meteor, Void Rift, Arcane Beam; spells 681 + weapon 47 · Z4 Meteor, Void Rift, Arcane Beam; spells 740 + weapon 52 · Z5 Meteor, Void Rift, Arcane Beam; spells 796 + weapon 57 · Z6 Meteor, Void Rift, Arcane Beam; spells 856 + weapon 61 · Z7 Meteor, Void Rift, Arcane Beam; spells 915 + weapon 67 · Z8 Meteor, Void Rift, Arcane Beam; spells 976 + weapon 71
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 145 + weapon 137 · Z2 Sunray, Purify; spells 180 + weapon 171 · Z3 Sunray, Purify; spells 217 + weapon 209 · Z4 Sunray, Purify; spells 236 + weapon 230 · Z5 Sunray, Purify; spells 254 + weapon 250 · Z6 Sunray, Purify; spells 274 + weapon 270 · Z7 Sunray, Purify; spells 293 + weapon 292 · Z8 Sunray, Purify; spells 313 + weapon 312

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 300 | 196 | 451 | 2.3 |
| 2 | 301 | 198 | 460 | 2.3 |
| 3 | 300 | 199 | 463 | 2.3 |
| 4 | 300 | 200 | 466 | 2.3 |
| 5 | 301 | 203 | 472 | 2.3 |
| 6 | 301 | 205 | 475 | 2.3 |
| 7 | 301 | 206 | 477 | 2.3 |
| 8 | 479 | 333 | 764 | 2.3 |

### NG+2

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 1,664 dps · 3.1s / 335s · 11.7 / 2.1 hits | 1,901 dps · 2.5s / 336s · 9.9 / 2.4 hits | 2,164 dps · 2.3s / 337s · 10.5 / 3.3 hits | 2,271 dps · 2.4s / 339s · 9.4 / 2.5 hits | 2,378 dps · 2.4s / 341s · 4.1 / 0.7 hits ⚠1-shot | 2,496 dps · 2.9s / 340s · 4.4 / 0.8 hits ⚠1-shot | 2,603 dps · 2.5s / 343s · 8.4 / 1.9 hits | 2,722 dps · 3.1s / 473s · 3.8 / 0.4 hits ⚠1-shot |
| Slicey: twin daggers | 1,160 dps · 4.4s / 480s · 11.7 / 1.5 hits | 1,331 dps · 3.5s / 481s · 7.5 / 1.7 hits | 1,521 dps · 3.2s / 480s · 8.6 / 2.2 hits | 1,602 dps · 3.4s / 480s · 10.5 / 1.7 hits | 1,684 dps · 3.4s / 481s · 10.6 / 2 hits | 1,774 dps · 4.1s / 479s · 12 / 2.4 hits | 1,863 dps · 3.5s / 480s · 8 / 1.3 hits | 1,949 dps · 4.4s / 660s · 9.9 / 1.3 hits |
| Quality: longsword + shield | 1,376 dps · 3.7s / 405s · 17.8 / 2.9 hits | 1,580 dps · 3s / 405s · 13.8 / 3.3 hits | 1,806 dps · 2.7s / 404s · 15.2 / 4.4 hits | 1,904 dps · 2.9s / 404s · 15.2 / 3.5 hits | 2,002 dps · 2.8s / 405s · 10.2 / 1.9 hits | 2,102 dps · 3.4s / 404s · 11.4 / 2.2 hits | 2,211 dps · 2.9s / 404s · 12.9 / 2.6 hits | 2,329 dps · 3.7s / 552s · 9.5 / 1.1 hits |
| Bow (Slicey) | 1,068 dps · 4.8s / 521s · 11.5 / 1.5 hits | 1,225 dps · 3.8s / 522s · 7.4 / 1.7 hits | 1,398 dps · 3.5s / 522s · 8.5 / 2.2 hits | 1,472 dps · 3.7s / 523s · 10.4 / 1.7 hits | 1,546 dps · 3.7s / 524s · 10.4 / 2 hits | 1,644 dps · 4.4s / 516s · 11.9 / 2.3 hits | 1,725 dps · 3.7s / 518s · 7.9 / 1.3 hits | 1,804 dps · 4.7s / 713s · 9.8 / 1.3 hits |
| Crossbow (Bonk) | 1,092 dps · 4.7s / 510s · 11.7 / 2.1 hits | 1,251 dps · 3.8s / 511s · 9.9 / 2.4 hits | 1,429 dps · 3.4s / 511s · 10.5 / 3.3 hits | 1,504 dps · 3.6s / 512s · 9.4 / 2.5 hits | 1,579 dps · 3.6s / 513s · 4.1 / 0.7 hits ⚠1-shot | 1,658 dps · 4.3s / 512s · 4.4 / 0.8 hits ⚠1-shot | 1,739 dps · 3.7s / 514s · 8.4 / 1.9 hits | 1,819 dps · 4.7s / 707s · 3.8 / 0.4 hits ⚠1-shot |
| Brain caster: staff spells | 1,210 dps · 4.3s / 460s · 11.5 / 1.5 hits | 1,383 dps · 3.4s / 462s · 7.4 / 1.7 hits | 1,571 dps · 3.1s / 464s · 8.5 / 2.2 hits | 1,649 dps · 3.3s / 467s · 10.4 / 1.7 hits | 1,727 dps · 3.3s / 469s · 10.4 / 2 hits | 1,806 dps · 4s / 470s · 11.9 / 2.3 hits | 1,890 dps · 3.4s / 473s · 7.9 / 1.3 hits | 1,968 dps · 4.3s / 654s · 9.8 / 1.3 hits |
| Prayer caster: talisman spells | 726 dps · 7.1s / 767s · 14.3 / 2.3 hits | 831 dps · 5.7s / 770s · 11.1 / 2.7 hits | 946 dps · 5.2s / 771s · 12.2 / 3.6 hits | 995 dps · 5.5s / 773s · 12.2 / 2.8 hits | 1,044 dps · 5.4s / 776s · 8.2 / 1.5 hits | 1,093 dps · 6.6s / 777s · 9.2 / 1.8 hits | 1,145 dps · 5.6s / 780s · 10.4 / 2.1 hits | 1,203 dps · 7.1s / 1,069s · 7.6 / 0.9 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 1,127 + weapon 83 · Z2 Meteor, Void Rift, Arcane Beam; spells 1,288 + weapon 95 · Z3 Meteor, Void Rift, Arcane Beam; spells 1,463 + weapon 108 · Z4 Meteor, Void Rift, Arcane Beam; spells 1,534 + weapon 115 · Z5 Meteor, Void Rift, Arcane Beam; spells 1,607 + weapon 120 · Z6 Meteor, Void Rift, Arcane Beam; spells 1,681 + weapon 126 · Z7 Meteor, Void Rift, Arcane Beam; spells 1,759 + weapon 131 · Z8 Meteor, Void Rift, Arcane Beam; spells 1,829 + weapon 138
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 362 + weapon 364 · Z2 Sunray, Purify; spells 414 + weapon 417 · Z3 Sunray, Purify; spells 470 + weapon 475 · Z4 Sunray, Purify; spells 493 + weapon 503 · Z5 Sunray, Purify; spells 517 + weapon 528 · Z6 Sunray, Purify; spells 541 + weapon 552 · Z7 Sunray, Purify; spells 566 + weapon 579 · Z8 Sunray, Purify; spells 589 + weapon 614

Boss time-to-kill across the builds (seconds):

| Zone | Median | Fastest | Slowest | Slowest ÷ fastest |
| --- | --- | --- | --- | --- |
| 1 | 480 | 335 | 767 | 2.3 |
| 2 | 481 | 336 | 770 | 2.3 |
| 3 | 480 | 337 | 771 | 2.3 |
| 4 | 480 | 339 | 773 | 2.3 |
| 5 | 481 | 341 | 776 | 2.3 |
| 6 | 479 | 340 | 777 | 2.3 |
| 7 | 480 | 343 | 780 | 2.3 |
| 8 | 660 | 473 | 1,069 | 2.3 |

## 3. Gems, compared

Each gem at the level a zone 5 drop has (first playthrough) and a +0% roll, on the quality build (longsword) at zone 5. Weapon gems are compared by how much they raise sustained light-attack DPS; armour gems by how much they raise effective HP against zone 5's room hits. Families that do neither are listed with their raw value.

Gem level 7 (zone 5 drop), +0% roll. Base: 184 DPS, 11.8 average hits to die.

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
| Leech | weapon | 4% lifesteal | — | heals 8.6% max HP per 10 s of attacking |
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
| Club | E/- | 2H | 213 | 79 | 183 | 31.1 | Bonk 42, Wild Swing 20, Tantrum 0 | ⚠ 0.55× median DPS |
| Twin Daggers | -/S | 1H | 294 | 101 | 99 | 13.8 | Shadow Step 48, Fan of Knives 13, Flurry 54 |  |
| Rapier | -/A | 1H | 341 | 125 | 174 | 19 | Lunge 48, Riposte Stance 0, Thousand Cuts 52 |  |
| Katana | D/A | 2H | 402 | 149 | 226 | 20.7 | Iai Slash 53, Crescent 32, Blood Moon 0 |  |
| Bow | -/B | 2H | 285 | 107 | 273 | 34.5 | Volley 75, Piercing Shot 38, Rain 14 |  |
| Whip | -/E | 1H | 198 | 85 | 141 | 20.7 | Lash 32, Crack 17, Serpent Coil 33 | ⚠ 0.59× median DPS |
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
| NG+1 | 40,954 → L85 | 34,882 → L93 | 37,760 → L99 | 34,115 → L104 | 38,788 → L108 | 40,022 → L112 | 47,582 → L116 | 42,447 → L120 |
| NG+2 | 45,227 → L123 | 39,408 → L125 | 42,090 → L127 | 37,165 → L129 | 42,785 → L130 | 45,177 → L132 | 53,067 → L134 | 45,671 → L136 |

Reinforcement: each +1 is +20% (×4 at +15), against rarity steps of ×1.06–×1.28. Glowen per step:

| + | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 | +11 | +12 | +13 | +14 | +15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Glowen | 100 | 145 | 210 | 305 | 442 | 641 | 929 | 1,348 | 1,954 | 2,833 | 4,108 | 5,957 | 8,638 | 12,525 | 18,162 |
| Power | ×1.2 | ×1.4 | ×1.6 | ×1.8 | ×2 | ×2.2 | ×2.4 | ×2.6 | ×2.8 | ×3 | ×3.2 | ×3.4 | ×3.6 | ×3.8 | ×4 |

## 6. Growth: player against the world

How the quality build's damage and toughness grow against the zone's enemies (zone 1 of the first playthrough = 1.00). A healthy curve keeps both ratios near 1.

| Cycle | Zone | Level | DPS | Foe HP | TTK s | Max HP | Hit taken | Hits to die | Kill time × | Survival × | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First playthrough | 1 | L6 | 34 | 90 | 2.7 | 293 | 22 | 13.5 | 1 | 1 |  |
| First playthrough | 2 | L15 | 52 | 122 | 2.3 | 345 | 22 | 15.5 | 0.88 | 1.15 |  |
| First playthrough | 3 | L26 | 79 | 166 | 2.1 | 398 | 33 | 12.2 | 0.79 | 0.9 |  |
| First playthrough | 4 | L37 | 125 | 226 | 1.8 | 450 | 35 | 12.7 | 0.68 | 0.94 |  |
| First playthrough | 5 | L47 | 184 | 272 | 1.5 | 503 | 43 | 11.8 | 0.56 | 0.88 |  |
| First playthrough | 6 | L57 | 275 | 391 | 1.4 | 555 | 47 | 11.8 | 0.54 | 0.87 |  |
| First playthrough | 7 | L67 | 332 | 388 | 1.2 | 608 | 48 | 12.8 | 0.44 | 0.95 |  |
| First playthrough | 8 | L76 | 386 | 563 | 1.5 | 645 | 52 | 12.3 | 0.55 | 0.91 |  |
| NG+1 | 1 | L85 | 500 | 2,058 | 4.1 | 675 | 44 | 15.3 | 1.55 | 1.13 |  |
| NG+1 | 2 | L93 | 636 | 1,884 | 3 | 695 | 64 | 10.9 | 1.12 | 0.81 |  |
| NG+1 | 3 | L99 | 778 | 1,958 | 2.5 | 715 | 62 | 11.5 | 0.95 | 0.85 |  |
| NG+1 | 4 | L104 | 859 | 2,194 | 2.6 | 725 | 62 | 11.7 | 0.96 | 0.87 |  |
| NG+1 | 5 | L108 | 934 | 2,269 | 2.4 | 745 | 71 | 10.4 | 0.92 | 0.77 |  |
| NG+1 | 6 | L112 | 1,014 | 2,875 | 2.8 | 755 | 75 | 10 | 1.07 | 0.74 |  |
| NG+1 | 7 | L116 | 1,097 | 2,573 | 2.3 | 765 | 65 | 11.8 | 0.88 | 0.88 |  |
| NG+1 | 8 | L120 | 1,181 | 3,421 | 2.9 | 775 | 89 | 8.7 | 1.09 | 0.64 |  |
| NG+2 | 1 | L123 | 1,376 | 5,145 | 3.7 | 785 | 57 | 13.8 | 1.41 | 1.03 |  |
| NG+2 | 2 | L125 | 1,580 | 4,711 | 3 | 795 | 83 | 9.5 | 1.12 | 0.71 |  |
| NG+2 | 3 | L127 | 1,806 | 4,895 | 2.7 | 795 | 84 | 9.4 | 1.02 | 0.7 |  |
| NG+2 | 4 | L129 | 1,904 | 5,485 | 2.9 | 805 | 85 | 9.4 | 1.09 | 0.7 |  |
| NG+2 | 5 | L130 | 2,002 | 5,671 | 2.8 | 805 | 102 | 7.9 | 1.07 | 0.59 |  |
| NG+2 | 6 | L132 | 2,102 | 7,188 | 3.4 | 815 | 110 | 7.4 | 1.29 | 0.55 |  |
| NG+2 | 7 | L134 | 2,211 | 6,433 | 2.9 | 815 | 94 | 8.7 | 1.1 | 0.65 |  |
| NG+2 | 8 | L136 | 2,329 | 8,552 | 3.7 | 825 | 136 | 6.1 | 1.38 | 0.45 | ⚠ survives 2.2× fewer hits |

