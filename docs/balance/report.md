# Balance report (generated)

Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.

## Findings, worst first

1. **One-shots** (severity 6): NG+2 zone 8: The Landlord's biggest hit (Supernova, pierce, 4,291 void) kills the Slicey: twin daggers build (664 HP) in one hit (0.92). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
2. **One-shots** (severity 6): NG+2 zone 8: The Landlord's biggest hit (Supernova, pierce, 4,291 void) kills the Bow (Slicey) build (656 HP) in one hit (0.91). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
3. **One-shots** (severity 6): NG+2 zone 8: The Landlord's biggest hit (Supernova, pierce, 4,291 void) kills the Brain caster: staff spells build (656 HP) in one hit (0.91). *Suggested:* Cap a boss hit at ~70% of an expected-level player's HP, or lower that attack's multiplier.
4. **Gems** (severity 4.6): Quicksilver raises sustained DPS by +3% (burst +7%) where Brutal gives +6% (0.41× Brutal). Stamina, not swing time, limits sustained damage, so speed is worth little. *Suggested:* Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.
5. **Spells** (severity 4.2): Comet Barrage (brain): 2.9 damage per busy second at Spell Skill 100, 0.36× the brain median (8). *Suggested:* Raise its base or shorten its cooldown (unless its utility is the point).
6. **NG+ levels** (severity 4): NG+2: a full clear buys only about 16 levels (level costs grow ×1.045 a level), while enemies grow ×2.5 in HP and damage; the player's own growth that cycle is nearly all reinforcement. *Suggested:* Flatten the level cost curve past level 80, raise NG+ Shard income, or soften NG_STEPS.
7. **Enemy curve** (severity 3.6): First playthrough: zone 8 room enemies hit for 100 on average, below zone 7's 106. *Suggested:* Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).
8. **Spells** (severity 3.5): Arcane Beam (brain): 16.4 damage per busy second at Spell Skill 100, 2.05× the brain median (8). *Suggested:* Lengthen its cooldown or lower its base.
9. **Enemy curve** (severity 3.2): NG+1: zone 7 room enemies have 2,222 HP on average, below zone 6's 2,483. *Suggested:* Check the zone roster mix and the HP curve.
10. **Enemy curve** (severity 3.2): NG+2: zone 7 room enemies have 5,399 HP on average, below zone 6's 6,033. *Suggested:* Check the zone roster mix and the HP curve.
11. **Enemy curve** (severity 3.1): NG+1: zone 2 room enemies have 1,649 HP on average, below zone 1's 1,829. *Suggested:* Check the zone roster mix and the HP curve.
12. **Gear power** (severity 3): Reinforcement reaches ×3.25 at +15, while the whole rarity ladder is ×1.28: a +15 common out-hits a +0 legendary 2.5×, so drops matter little once reinforcement starts. *Suggested:* Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.
13. **Boss curve** (severity 3): NG+1: Mother Spore (zone 2) averages 341 a hit, below zone 1's boss (383). *Suggested:* Raise its phase damage multipliers.
14. **Boss curve** (severity 3): NG+2: Mother Spore (zone 2) averages 853 a hit, below zone 1's boss (958). *Suggested:* Raise its phase damage multipliers.

(2 more findings of the same kinds are in the tables below.)

## 1. Enemies and bosses by zone

Room enemies: each roster enemy spawned with the real spawn code (solo); a hit is `attackDamage` for each attack with a damage multiplier. Bosses: every phase walked with the real phase code; the phase bar is the HP that phase has to lose.

### First playthrough

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 90 | 18–180 | 25 | 8–48 |  |
| 2 | 122 | 28–279 | 29 | 5–70 |  |
| 3 | 166 | 38–378 | 43 | 8–136 |  |
| 4 | 217 | 46–571 | 56 | 5–162 |  |
| 5 | 253 | 53–579 | 72 | 18–152 |  |
| 6 | 354 | 61–856 | 87 | 15–228 |  |
| 7 | 351 | 70–877 | 106 | 30–318 |  |
| 8 | 510 | 79–1,187 | 100 | 19–386 | ⚠ hits softer than zone 7 |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 36 (70) | 51 (109) | 59 (147) | 88 (178) | 98 (208) | 124 (238) | 156 (273) | 97 (308) |
| brute | 39 (180) | 54 (279) | 97 (378) | 131 (457) | 114 (535) | 198 (856) | 262 (701) | 239 (1,187) |
| caster | 28 (55) | 24 (85) | 35 (116) | 57 (140) | 53 (163) | 73 (187) | 92 (214) | 61 (242) |
| fodder | 22 (60) | 23 (102) | 27 (113) | 42 (152) | 56 (196) | 65 (245) | 83 (281) | 75 (343) |
| hazard | 14 (80) | 22 (124) | 48 (218) | 36 (203) | 63 (285) | 70 (272) | 84 (312) | 110 (703) |
| ranged | 18 (50) | 19 (78) | 41 (105) | 43 (127) | 52 (149) | 57 (170) | 84 (292) | 62 (220) |
| support | 17 (55) | 21 (85) | — | 42 (140) | 100 (163) | 42 (187) | 51 (214) | 80 (242) |
| swarm | 8 (18) | 8 (28) | 10 (38) | 9 (46) | 20 (53) | 18 (61) | 35 (70) | 28 (79) |
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
| 1 | 1,829 | 367–3,667 | 128 | 41–243 |  |
| 2 | 1,649 | 376–3,757 | 225 | 42–549 | ⚠ HP below zone 1 |
| 3 | 1,691 | 385–3,853 | 230 | 43–720 |  |
| 4 | 1,895 | 400–4,998 | 252 | 24–726 |  |
| 5 | 1,959 | 414–4,489 | 265 | 65–560 |  |
| 6 | 2,483 | 429–6,005 | 277 | 48–723 |  |
| 7 | 2,222 | 443–5,544 | 293 | 83–881 | ⚠ HP below zone 6 |
| 8 | 2,954 | 458–6,870 | 312 | 60–1,205 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 185 (1,426) | 399 (1,461) | 311 (1,498) | 395 (1,555) | 361 (1,612) | 394 (1,668) | 433 (1,725) | 301 (1,781) |
| brute | 196 (3,667) | 422 (3,757) | 516 (3,853) | 585 (3,999) | 421 (4,144) | 629 (6,005) | 726 (4,435) | 746 (6,870) |
| caster | 139 (1,120) | 186 (1,148) | 183 (1,177) | 255 (1,222) | 194 (1,266) | 232 (1,311) | 255 (1,355) | 189 (1,400) |
| fodder | 110 (1,222) | 181 (1,377) | 142 (1,156) | 186 (1,333) | 206 (1,519) | 208 (1,716) | 230 (1,774) | 232 (1,985) |
| hazard | 71 (1,630) | 169 (1,670) | 252 (2,226) | 161 (1,777) | 234 (2,210) | 221 (1,906) | 232 (1,971) | 344 (4,071) |
| ranged | 91 (1,019) | 148 (1,044) | 216 (1,070) | 192 (1,111) | 193 (1,151) | 181 (1,192) | 232 (1,848) | 194 (1,272) |
| support | 84 (1,120) | 163 (1,148) | — | 189 (1,222) | 369 (1,266) | 133 (1,311) | 140 (1,355) | 249 (1,400) |
| swarm | 41 (367) | 63 (376) | 50 (385) | 40 (400) | 73 (414) | 56 (429) | 96 (443) | 86 (458) |
| tank | 165 (3,056) | 343 (3,131) | 304 (3,211) | 332 (4,998) | 388 (4,489) | 359 (4,647) | 362 (5,544) | 392 (5,153) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 28,233 / 42,349 / 42,349 | 112,931 | 351 / 367 / 422 | 689 |  |
| 2 | Mother Spore | 3 | 35,312 / 52,968 / 52,968 | 141,249 | 232 / 351 / 404 | 683 | ⚠ hits softer than zone 1's boss |
| 3 | The Bloatking | 3 | 42,578 / 63,868 / 63,868 | 170,313 | 278 / 358 / 412 | 568 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 46,904 / 70,356 / 70,356 | 187,617 | 331 / 464 / 533 | 770 |  |
| 5 | Foreman Ignatius | 3 | 77,078 / 64,233 / 64,233 | 205,544 | 372 / 540 / 621 | 1,097 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 27,909 / 97,683 / 97,683 | 223,275 | 356 / 540 / 621 | 999 |  |
| 7 | Archmagister Tock | 3 | 72,244 / 84,285 / 84,285 | 240,813 | 522 / 790 / 908 | 1,191 |  |
| 8 | The Landlord | 4 | 100,445 / 97,491 / 97,490 / 116,989 | 412,416 | 605 / 770 / 1,136 / 962 | 1,717 |  |

### NG+2

| Zone | Avg HP | HP range | Avg hit | Hit range | Flags |
| --- | --- | --- | --- | --- | --- |
| 1 | 4,394 | 881–8,808 | 319 | 101–609 |  |
| 2 | 3,986 | 908–9,082 | 563 | 106–1,372 | ⚠ HP below zone 1 |
| 3 | 4,109 | 936–9,362 | 575 | 108–1,799 |  |
| 4 | 4,604 | 971–12,143 | 630 | 60–1,815 |  |
| 5 | 4,760 | 1,007–10,907 | 661 | 163–1,399 |  |
| 6 | 6,033 | 1,042–14,590 | 693 | 121–1,808 |  |
| 7 | 5,399 | 1,077–13,468 | 734 | 209–2,202 | ⚠ HP below zone 6 |
| 8 | 7,177 | 1,113–16,692 | 781 | 151–3,012 |  |

Average hit by role (HP in brackets):

| Role | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assassin | 462 (3,426) | 998 (3,532) | 777 (3,641) | 988 (3,778) | 902 (3,915) | 984 (4,053) | 1,082 (4,190) | 753 (4,327) |
| brute | 490 (8,808) | 1,056 (9,082) | 1,289 (9,362) | 1,462 (9,715) | 1,052 (10,068) | 1,573 (14,590) | 1,816 (10,775) | 1,865 (16,692) |
| caster | 349 (2,691) | 465 (2,775) | 458 (2,860) | 638 (2,968) | 485 (3,076) | 580 (3,184) | 638 (3,292) | 473 (3,400) |
| fodder | 274 (2,936) | 451 (3,330) | 354 (2,808) | 465 (3,238) | 515 (3,692) | 520 (4,169) | 574 (4,310) | 581 (4,822) |
| hazard | 178 (3,915) | 422 (4,036) | 630 (5,409) | 403 (4,318) | 585 (5,370) | 552 (4,632) | 580 (4,789) | 861 (9,891) |
| ranged | 228 (2,447) | 369 (2,523) | 540 (2,600) | 479 (2,699) | 483 (2,797) | 452 (2,895) | 580 (4,489) | 484 (3,091) |
| support | 209 (2,691) | 406 (2,775) | — | 471 (2,968) | 924 (3,076) | 331 (3,184) | 351 (3,292) | 621 (3,400) |
| swarm | 101 (881) | 158 (908) | 126 (936) | 101 (971) | 183 (1,007) | 141 (1,042) | 240 (1,077) | 215 (1,113) |
| tank | 412 (7,340) | 858 (7,568) | 760 (7,801) | 830 (12,143) | 970 (10,907) | 898 (11,290) | 904 (13,468) | 979 (12,519) |

| Zone | Boss | Phases | HP per phase | Total HP | Avg hit per phase | Biggest hit | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Caretaker | 3 | 118,914 / 178,371 / 178,371 | 475,655 | 879 / 917 / 1,054 | 1,722 |  |
| 2 | Mother Spore | 3 | 135,321 / 202,982 / 202,982 | 541,285 | 579 / 878 / 1,010 | 1,707 | ⚠ hits softer than zone 1's boss |
| 3 | The Bloatking | 3 | 153,061 / 229,591 / 229,591 | 612,242 | 694 / 895 / 1,029 | 1,419 |  |
| 4 | Vexthorn, the Hollow Stag | 3 | 161,435 / 242,153 / 242,153 | 645,741 | 828 / 1,159 / 1,333 | 1,924 |  |
| 5 | Foreman Ignatius | 3 | 254,922 / 212,436 / 212,436 | 679,793 | 931 / 1,349 / 1,552 | 2,743 |  |
| 6 | Saint Aurelia the Unthawed | 3 | 89,071 / 311,748 / 311,748 | 712,567 | 889 / 1,350 / 1,552 | 2,498 |  |
| 7 | Archmagister Tock | 3 | 224,973 / 262,468 / 262,468 | 749,910 | 1,304 / 1,974 / 2,270 | 2,977 |  |
| 8 | The Landlord | 4 | 262,951 / 255,217 / 255,216 / 306,260 | 1,079,643 | 1,513 / 1,926 / 2,839 / 2,406 | 4,291 |  |

## 2. Time to kill and hits to die

Each build at the zone's expected level, with points split as listed, wearing the zone's full **medium armour set at Rare (blue)** and its weapon at the zone's item level (no affixes or gems), both reinforced as far as that area allows, the weapon at the rarity assumed below. **DPS** is sustained light-attack damage per second (swing until the stamina bar is empty, then wait for it to refill); casters cast their three best damaging spells as often as cooldowns, cast time and stamina allow. **TTK** = seconds of that DPS to kill the zone's average room enemy / its boss (all phases). **Hits** = average hits of the zone's room enemies / the boss's biggest hit to kill the build, after its defense.

| Cycle | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First playthrough | L6 · ilvl 1 · uncommon +0 | L15 · ilvl 2 · uncommon +0 | L26 · ilvl 3 · rare +0 | L37 · ilvl 4 · rare +1 | L47 · ilvl 5 · rare +2 | L57 · ilvl 6 · epic +3 | L67 · ilvl 7 · epic +3 | L76 · ilvl 8 · epic +3 |
| NG+1 | L85 · ilvl 9 · epic +4 | L93 · ilvl 10 · epic +5 | L99 · ilvl 11 · epic +6 | L104 · ilvl 12 · epic +6 | L108 · ilvl 13 · epic +6 | L112 · ilvl 14 · epic +6 | L116 · ilvl 15 · epic +6 | L120 · ilvl 16 · epic +6 |
| NG+2 | L123 · ilvl 17 · epic +7 | L125 · ilvl 18 · epic +8 | L127 · ilvl 19 · epic +9 | L129 · ilvl 20 · epic +9 | L130 · ilvl 21 · epic +9 | L132 · ilvl 22 · epic +9 | L134 · ilvl 23 · epic +9 | L136 · ilvl 24 · epic +9 |

### First playthrough

| Build | Z1 | Z2 | Z3 | Z4 | Z5 | Z6 | Z7 | Z8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bonk: greathammer (2H) | 41 dps · 2.2s / 62s · 18.6 / 3.2 hits | 65 dps · 1.9s / 86s · 23.2 / 3.1 hits | 99 dps · 1.7s / 76s · 19.4 / 3.9 hits | 154 dps · 1.4s / 68s · 21.5 / 3.2 hits | 220 dps · 1.2s / 78s · 15.4 / 2.2 hits | 321 dps · 1.1s / 59s · 18 / 2.8 hits | 382 dps · 0.9s / 55s · 18.1 / 3 hits | 458 dps · 1.1s / 121s · 18.2 / 1.4 hits |
| Slicey: twin daggers | 26 dps · 3.5s / 97s · 13.6 / 2.3 hits | 41 dps · 3s / 135s · 17.4 / 2.4 hits | 63 dps · 2.6s / 119s · 14.8 / 3 hits | 99 dps · 2.2s / 106s · 16.7 / 2.5 hits | 143 dps · 1.8s / 120s · 12.1 / 1.7 hits | 211 dps · 1.7s / 89s · 14.3 / 2.2 hits | 254 dps · 1.4s / 83s · 14.6 / 2.4 hits | 297 dps · 1.7s / 186s · 15.2 / 1.1 hits |
| Quality: longsword + shield | 34 dps · 2.7s / 74s · 17.6 / 3 hits | 52 dps · 2.3s / 107s · 22.4 / 3 hits | 79 dps · 2.1s / 96s · 19 / 3.8 hits | 120 dps · 1.8s / 87s · 21.3 / 3.2 hits | 171 dps · 1.5s / 100s · 15.5 / 2.2 hits | 249 dps · 1.4s / 76s · 18.2 / 2.8 hits | 301 dps · 1.2s / 70s · 18.6 / 3 hits | 350 dps · 1.5s / 158s · 18.9 / 1.4 hits |
| Bow (Slicey) | 26 dps · 3.4s / 96s · 12.7 / 2.2 hits | 41 dps · 3s / 137s · 16.5 / 2.2 hits | 61 dps · 2.7s / 124s · 14.1 / 2.8 hits | 97 dps · 2.2s / 109s · 16 / 2.4 hits | 138 dps · 1.8s / 124s · 11.7 / 1.7 hits | 200 dps · 1.8s / 94s · 13.8 / 2.1 hits | 238 dps · 1.5s / 88s · 14.2 / 2.3 hits | 276 dps · 1.8s / 200s · 14.8 / 1.1 hits |
| Crossbow (Bonk) | 27 dps · 3.3s / 92s · 18.6 / 3.2 hits | 43 dps · 2.9s / 131s · 23.2 / 3.1 hits | 63 dps · 2.6s / 119s · 19.4 / 3.9 hits | 97 dps · 2.2s / 109s · 21.5 / 3.2 hits | 142 dps · 1.8s / 121s · 15.4 / 2.2 hits | 206 dps · 1.7s / 91s · 18 / 2.8 hits | 245 dps · 1.4s / 86s · 18.1 / 3 hits | 284 dps · 1.8s / 195s · 18.2 / 1.4 hits |
| Brain caster: staff spells | 37 dps · 2.4s / 68s · 12.7 / 2.2 hits | 63 dps · 1.9s / 88s · 16.5 / 2.2 hits | 95 dps · 1.7s / 79s · 14.1 / 2.8 hits | 138 dps · 1.6s / 76s · 16 / 2.4 hits | 190 dps · 1.3s / 90s · 11.7 / 1.7 hits | 267 dps · 1.3s / 70s · 13.8 / 2.1 hits | 310 dps · 1.1s / 68s · 14.2 / 2.3 hits | 352 dps · 1.5s / 157s · 14.8 / 1.1 hits |
| Prayer caster: talisman spells | 37 dps · 2.4s / 69s · 13.6 / 2.3 hits | 33 dps · 3.7s / 167s · 17.4 / 2.4 hits | 49 dps · 3.4s / 155s · 14.8 / 3 hits | 73 dps · 3s / 143s · 16.7 / 2.5 hits | 103 dps · 2.5s / 167s · 12.1 / 1.7 hits | 147 dps · 2.4s / 128s · 14.3 / 2.2 hits | 173 dps · 2s / 122s · 14.6 / 2.4 hits | 199 dps · 2.6s / 278s · 15.2 / 1.1 hits |

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
| Bonk: greathammer (2H) | 577 dps · 3.2s / 196s · 18.8 / 3 hits | 713 dps · 2.3s / 198s · 15.1 / 3.6 hits | 857 dps · 2s / 199s · 17.5 / 5.1 hits | 939 dps · 2s / 200s · 18.2 / 4.1 hits | 1,014 dps · 1.9s / 203s · 12.9 / 2.4 hits | 1,090 dps · 2.3s / 205s · 14.7 / 2.8 hits | 1,167 dps · 1.9s / 206s · 16.6 / 3.3 hits | 1,239 dps · 2.4s / 333s · 12.8 / 1.6 hits |
| Slicey: twin daggers | 377 dps · 4.9s / 300s · 15.8 / 2.5 hits | 470 dps · 3.5s / 301s · 12.7 / 3 hits | 567 dps · 3s / 300s · 14.8 / 4.3 hits | 626 dps · 3s / 300s · 15.3 / 3.4 hits | 683 dps · 2.9s / 301s · 10.9 / 2 hits | 741 dps · 3.4s / 301s · 12.4 / 2.4 hits | 801 dps · 2.8s / 301s · 14 / 2.8 hits | 861 dps · 3.4s / 479s · 10.8 / 1.3 hits |
| Quality: longsword + shield | 444 dps · 4.1s / 254s · 19.7 / 3.1 hits | 556 dps · 3s / 254s · 15.7 / 3.8 hits | 672 dps · 2.5s / 253s · 18.3 / 5.3 hits | 742 dps · 2.6s / 253s · 19 / 4.2 hits | 806 dps · 2.4s / 255s · 13.5 / 2.5 hits | 876 dps · 2.8s / 255s · 15.4 / 2.9 hits | 947 dps · 2.3s / 254s · 17.4 / 3.4 hits | 1,020 dps · 2.9s / 404s · 13.5 / 1.6 hits |
| Bow (Slicey) | 356 dps · 5.1s / 317s · 15.6 / 2.5 hits | 440 dps · 3.7s / 321s · 12.5 / 3 hits | 530 dps · 3.2s / 322s · 14.6 / 4.2 hits | 583 dps · 3.3s / 322s · 15.1 / 3.4 hits | 632 dps · 3.1s / 325s · 10.8 / 2 hits | 685 dps · 3.6s / 326s · 12.3 / 2.3 hits | 739 dps · 3s / 326s · 13.9 / 2.7 hits | 793 dps · 3.7s / 520s · 10.7 / 1.3 hits |
| Crossbow (Bonk) | 358 dps · 5.1s / 316s · 18.8 / 3 hits | 442 dps · 3.7s / 320s · 15.1 / 3.6 hits | 532 dps · 3.2s / 320s · 17.5 / 5.1 hits | 596 dps · 3.2s / 315s · 18.2 / 4.1 hits | 647 dps · 3s / 318s · 12.9 / 2.4 hits | 701 dps · 3.5s / 319s · 14.7 / 2.8 hits | 756 dps · 2.9s / 319s · 16.6 / 3.3 hits | 810 dps · 3.6s / 509s · 12.8 / 1.6 hits |
| Brain caster: staff spells | 435 dps · 4.2s / 260s · 15.6 / 2.5 hits | 529 dps · 3.1s / 267s · 12.5 / 3 hits | 629 dps · 2.7s / 271s · 14.6 / 4.2 hits | 684 dps · 2.8s / 274s · 15.1 / 3.4 hits | 737 dps · 2.7s / 279s · 10.8 / 2 hits | 792 dps · 3.1s / 282s · 12.3 / 2.3 hits | 848 dps · 2.6s / 284s · 13.9 / 2.7 hits | 904 dps · 3.3s / 456s · 10.7 / 1.3 hits |
| Prayer caster: talisman spells | 250 dps · 7.3s / 451s · 15.8 / 2.5 hits | 307 dps · 5.4s / 460s · 12.7 / 3 hits | 368 dps · 4.6s / 463s · 14.8 / 4.3 hits | 403 dps · 4.7s / 466s · 15.3 / 3.4 hits | 436 dps · 4.5s / 472s · 10.9 / 2 hits | 470 dps · 5.3s / 475s · 12.4 / 2.4 hits | 505 dps · 4.4s / 477s · 14 / 2.8 hits | 540 dps · 5.5s / 764s · 10.8 / 1.3 hits |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 407 + weapon 28 · Z2 Meteor, Void Rift, Arcane Beam; spells 495 + weapon 34 · Z3 Meteor, Void Rift, Arcane Beam; spells 588 + weapon 41 · Z4 Meteor, Void Rift, Arcane Beam; spells 639 + weapon 45 · Z5 Meteor, Void Rift, Arcane Beam; spells 687 + weapon 49 · Z6 Meteor, Void Rift, Arcane Beam; spells 739 + weapon 53 · Z7 Meteor, Void Rift, Arcane Beam; spells 790 + weapon 58 · Z8 Meteor, Void Rift, Arcane Beam; spells 843 + weapon 61
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 129 + weapon 122 · Z2 Sunray, Purify; spells 157 + weapon 150 · Z3 Sunray, Purify; spells 187 + weapon 181 · Z4 Sunray, Purify; spells 204 + weapon 199 · Z5 Sunray, Purify; spells 219 + weapon 216 · Z6 Sunray, Purify; spells 236 + weapon 233 · Z7 Sunray, Purify; spells 253 + weapon 252 · Z8 Sunray, Purify; spells 270 + weapon 270

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
| Bonk: greathammer (2H) | 1,421 dps · 3.1s / 335s · 16.9 / 2.8 hits | 1,609 dps · 2.5s / 336s · 13.2 / 3.2 hits | 1,816 dps · 2.3s / 337s · 14.5 / 4.2 hits | 1,906 dps · 2.4s / 339s · 14.5 / 3.3 hits | 1,996 dps · 2.4s / 341s · 9.7 / 1.8 hits | 2,095 dps · 2.9s / 340s · 10.9 / 2.1 hits | 2,185 dps · 2.5s / 343s · 12.3 / 2.4 hits | 2,285 dps · 3.1s / 473s · 9 / 1.1 hits |
| Slicey: twin daggers | 991 dps · 4.4s / 480s · 14.3 / 2.3 hits | 1,126 dps · 3.5s / 481s · 11.1 / 2.7 hits | 1,276 dps · 3.2s / 480s · 12.2 / 3.6 hits | 1,345 dps · 3.4s / 480s · 12.2 / 2.8 hits | 1,413 dps · 3.4s / 481s · 8.2 / 1.5 hits | 1,489 dps · 4.1s / 479s · 9.2 / 1.8 hits | 1,564 dps · 3.5s / 480s · 10.4 / 2.1 hits | 1,636 dps · 4.4s / 660s · 7.6 / 0.9 hits ⚠1-shot |
| Quality: longsword + shield | 1,175 dps · 3.7s / 405s · 17.8 / 2.9 hits | 1,337 dps · 3s / 405s · 13.8 / 3.3 hits | 1,516 dps · 2.7s / 404s · 15.2 / 4.4 hits | 1,598 dps · 2.9s / 404s · 15.2 / 3.5 hits | 1,680 dps · 2.8s / 405s · 10.2 / 1.9 hits | 1,764 dps · 3.4s / 404s · 11.4 / 2.2 hits | 1,856 dps · 2.9s / 404s · 12.9 / 2.6 hits | 1,955 dps · 3.7s / 552s · 9.5 / 1.1 hits |
| Bow (Slicey) | 912 dps · 4.8s / 521s · 14.1 / 2.3 hits | 1,036 dps · 3.8s / 522s · 11 / 2.6 hits | 1,173 dps · 3.5s / 522s · 12.1 / 3.5 hits | 1,235 dps · 3.7s / 523s · 12.1 / 2.8 hits | 1,297 dps · 3.7s / 524s · 8.1 / 1.5 hits | 1,380 dps · 4.4s / 516s · 9.1 / 1.7 hits | 1,448 dps · 3.7s / 518s · 10.3 / 2 hits | 1,514 dps · 4.7s / 713s · 7.5 / 0.9 hits ⚠1-shot |
| Crossbow (Bonk) | 932 dps · 4.7s / 510s · 16.9 / 2.8 hits | 1,059 dps · 3.8s / 511s · 13.2 / 3.2 hits | 1,199 dps · 3.4s / 511s · 14.5 / 4.2 hits | 1,262 dps · 3.6s / 512s · 14.5 / 3.3 hits | 1,325 dps · 3.6s / 513s · 9.7 / 1.8 hits | 1,391 dps · 4.3s / 512s · 10.9 / 2.1 hits | 1,460 dps · 3.7s / 514s · 12.3 / 2.4 hits | 1,527 dps · 4.7s / 707s · 9 / 1.1 hits |
| Brain caster: staff spells | 1,033 dps · 4.3s / 460s · 14.1 / 2.3 hits | 1,171 dps · 3.4s / 462s · 11 / 2.6 hits | 1,319 dps · 3.1s / 464s · 12.1 / 3.5 hits | 1,383 dps · 3.3s / 467s · 12.1 / 2.8 hits | 1,450 dps · 3.3s / 469s · 8.1 / 1.5 hits | 1,516 dps · 4s / 470s · 9.1 / 1.7 hits | 1,586 dps · 3.4s / 473s · 10.3 / 2 hits | 1,652 dps · 4.3s / 654s · 7.5 / 0.9 hits ⚠1-shot |
| Prayer caster: talisman spells | 620 dps · 7.1s / 767s · 14.3 / 2.3 hits | 703 dps · 5.7s / 770s · 11.1 / 2.7 hits | 794 dps · 5.2s / 771s · 12.2 / 3.6 hits | 835 dps · 5.5s / 773s · 12.2 / 2.8 hits | 876 dps · 5.4s / 776s · 8.2 / 1.5 hits | 918 dps · 6.6s / 777s · 9.2 / 1.8 hits | 961 dps · 5.6s / 780s · 10.4 / 2.1 hits | 1,010 dps · 7.1s / 1,069s · 7.6 / 0.9 hits ⚠1-shot |

- Brain caster: staff spells: Z1 Meteor, Void Rift, Arcane Beam; spells 962 + weapon 71 · Z2 Meteor, Void Rift, Arcane Beam; spells 1,090 + weapon 80 · Z3 Meteor, Void Rift, Arcane Beam; spells 1,228 + weapon 90 · Z4 Meteor, Void Rift, Arcane Beam; spells 1,287 + weapon 96 · Z5 Meteor, Void Rift, Arcane Beam; spells 1,349 + weapon 101 · Z6 Meteor, Void Rift, Arcane Beam; spells 1,411 + weapon 105 · Z7 Meteor, Void Rift, Arcane Beam; spells 1,476 + weapon 110 · Z8 Meteor, Void Rift, Arcane Beam; spells 1,535 + weapon 116
- Prayer caster: talisman spells: Z1 Sunray, Purify; spells 309 + weapon 311 · Z2 Sunray, Purify; spells 350 + weapon 353 · Z3 Sunray, Purify; spells 395 + weapon 399 · Z4 Sunray, Purify; spells 414 + weapon 422 · Z5 Sunray, Purify; spells 434 + weapon 443 · Z6 Sunray, Purify; spells 454 + weapon 464 · Z7 Sunray, Purify; spells 475 + weapon 486 · Z8 Sunray, Purify; spells 494 + weapon 515

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
| NG+1 | 40,954 → L85 | 34,882 → L93 | 37,760 → L99 | 34,115 → L104 | 38,788 → L108 | 40,022 → L112 | 47,582 → L116 | 42,447 → L120 |
| NG+2 | 45,227 → L123 | 39,408 → L125 | 42,090 → L127 | 37,165 → L129 | 42,785 → L130 | 45,177 → L132 | 53,067 → L134 | 45,671 → L136 |

Reinforcement: each +1 is +20% (×4 at +15), against rarity steps of ×1.06–×1.28. Glowen per step:

| + | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 | +11 | +12 | +13 | +14 | +15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Glowen | 100 | 145 | 210 | 305 | 442 | 641 | 929 | 1,348 | 1,954 | 2,833 | 4,108 | 5,957 | 8,638 | 12,525 | 18,162 |
| Power | ×1.15 | ×1.3 | ×1.45 | ×1.6 | ×1.75 | ×1.9 | ×2.05 | ×2.2 | ×2.35 | ×2.5 | ×2.65 | ×2.8 | ×2.95 | ×3.1 | ×3.25 |

## 6. Growth: player against the world

How the quality build's damage and toughness grow against the zone's enemies (zone 1 of the first playthrough = 1.00). A healthy curve keeps both ratios near 1.

| Cycle | Zone | Level | DPS | Foe HP | TTK s | Max HP | Hit taken | Hits to die | Kill time × | Survival × | Flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| First playthrough | 1 | L6 | 34 | 90 | 2.7 | 293 | 22 | 13.5 | 1 | 1 |  |
| First playthrough | 2 | L15 | 52 | 122 | 2.3 | 345 | 22 | 15.5 | 0.88 | 1.15 |  |
| First playthrough | 3 | L26 | 79 | 166 | 2.1 | 398 | 33 | 12.2 | 0.79 | 0.9 |  |
| First playthrough | 4 | L37 | 120 | 217 | 1.8 | 450 | 35 | 12.7 | 0.68 | 0.94 |  |
| First playthrough | 5 | L47 | 171 | 253 | 1.5 | 503 | 43 | 11.8 | 0.56 | 0.88 |  |
| First playthrough | 6 | L57 | 249 | 354 | 1.4 | 555 | 47 | 11.8 | 0.54 | 0.87 |  |
| First playthrough | 7 | L67 | 301 | 351 | 1.2 | 608 | 48 | 12.8 | 0.44 | 0.95 |  |
| First playthrough | 8 | L76 | 350 | 510 | 1.5 | 645 | 52 | 12.3 | 0.55 | 0.91 |  |
| NG+1 | 1 | L85 | 444 | 1,829 | 4.1 | 675 | 44 | 15.3 | 1.55 | 1.13 |  |
| NG+1 | 2 | L93 | 556 | 1,649 | 3 | 695 | 64 | 10.9 | 1.12 | 0.81 |  |
| NG+1 | 3 | L99 | 672 | 1,691 | 2.5 | 715 | 62 | 11.5 | 0.95 | 0.85 |  |
| NG+1 | 4 | L104 | 742 | 1,895 | 2.6 | 725 | 62 | 11.7 | 0.96 | 0.87 |  |
| NG+1 | 5 | L108 | 806 | 1,959 | 2.4 | 745 | 71 | 10.4 | 0.92 | 0.77 |  |
| NG+1 | 6 | L112 | 876 | 2,483 | 2.8 | 755 | 75 | 10 | 1.07 | 0.74 |  |
| NG+1 | 7 | L116 | 947 | 2,222 | 2.3 | 765 | 65 | 11.8 | 0.88 | 0.88 |  |
| NG+1 | 8 | L120 | 1,020 | 2,954 | 2.9 | 775 | 89 | 8.7 | 1.09 | 0.64 |  |
| NG+2 | 1 | L123 | 1,175 | 4,394 | 3.7 | 785 | 57 | 13.8 | 1.41 | 1.03 |  |
| NG+2 | 2 | L125 | 1,337 | 3,986 | 3 | 795 | 83 | 9.5 | 1.12 | 0.71 |  |
| NG+2 | 3 | L127 | 1,516 | 4,109 | 2.7 | 795 | 84 | 9.4 | 1.02 | 0.7 |  |
| NG+2 | 4 | L129 | 1,598 | 4,604 | 2.9 | 805 | 85 | 9.4 | 1.09 | 0.7 |  |
| NG+2 | 5 | L130 | 1,680 | 4,760 | 2.8 | 805 | 102 | 7.9 | 1.07 | 0.59 |  |
| NG+2 | 6 | L132 | 1,764 | 6,033 | 3.4 | 815 | 110 | 7.4 | 1.29 | 0.55 |  |
| NG+2 | 7 | L134 | 1,856 | 5,399 | 2.9 | 815 | 94 | 8.7 | 1.1 | 0.65 |  |
| NG+2 | 8 | L136 | 1,955 | 7,177 | 3.7 | 825 | 136 | 6.1 | 1.38 | 0.45 | ⚠ survives 2.2× fewer hits |

