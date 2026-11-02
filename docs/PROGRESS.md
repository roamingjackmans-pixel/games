# Dungeon Joe — Build progress

> **Next session starts here:** M0–M2 done (repo is github.com/roamingjackmans-pixel/games, live path /games/dungeonjoe/, D48).
> Continue at M3 (enemy framework + Mossy Crypt roster). Dev: npm run dev → http://localhost:5173/games/dungeonjoe/?debug

Tick items as `[x]` with the commit hash and date. Add sub-items freely. Never delete a line.

## M0 — Repo, tooling, deploy pipeline
- [x] Vite + TS scaffold, lint, vitest, playwright, scripts — 5013bff 2026-11-02
- [x] `.gitignore` (incl. `docs/OWNER_PRIVATE.md`), git init, first commit — 5013bff 2026-11-02
- [x] `gh repo create DungeonJoe --public --source . --push` — 5013bff 2026-11-02 (github.com/roamingjackmans-pixel/DungeonJoe, renamed to github.com/roamingjackmans-pixel/games for /games/dungeonjoe/, D48)
- [x] `.github/workflows/deploy.yml`, `public/404.html`, README — 5013bff 2026-11-02
- [x] Owner reminded: Settings → Pages → Source: GitHub Actions (on the `games` repo) — 5013bff 2026-11-02 (also in the final message)

## M1 — Engine core
- [x] loop, canvas scaling, DPR, fullscreen — 3420a78 2026-11-02
- [x] input: keyboard, mouse, gamepad, bindings, InputFrame — 3420a78 2026-11-02
- [x] rng streams, math, scene manager, particles, tween, text — 3420a78 2026-11-02
- [x] draw parts + glow pre-render — 3420a78 2026-11-02
- [x] audio mixer + Sfx synth + unlock — 3420a78 2026-11-02
- [x] settings persistence — 3420a78 2026-11-02
- [x] debug menu (SHA-256 gate) with all listed tools — 3420a78 2026-11-02
- [x] tests; browser check — 3420a78 2026-11-02 — browser: WASD moves Joe ~260 px/s, aim follows cursor, wrong code refused, panel opens (dev ?debug); owner code verified against the hash offline. Gamepad path not physically tested (no pad attached).

## M2 — Player, combat core, telegraphs
- [x] world/ECS + system order — 5f42d31 2026-11-02
- [x] movement, stamina, dodge (5 s ring) — 5f42d31 2026-11-02
- [x] combos for Longsword, Greathammer, Twin Daggers, Bow; hitboxes — 5f42d31 2026-11-02
- [x] block, stability, guard break, parry, riposte, two-hand + weapon guard — 5f42d31 2026-11-02
- [x] damage pipeline, types, defenses, 5 statuses, poise/stagger, hitstop, numbers — 5f42d31 2026-11-02
- [x] all pattern primitives + telegraph drawing + hit tests + escapability helper — 5f42d31 2026-11-02
- [x] Red / Piercing rules — 5f42d31 2026-11-02
- [x] HUD v1 — 5f42d31 2026-11-02
- [x] tests; browser check with scripted dummy — 5f42d31 2026-11-02 — browser (loop.advance in the hidden pane): dummy swing blocked 2 HP vs 20 unblocked; Red stomp guard-breaks when blocked, 0 dmg when dodged; Piercing ring escaped by position; greathammer first hit 0.57 s vs daggers 0.18 s; bow tap 12 vs charged 22. 35 unit tests.

## M3 — Enemy framework, Zone 1, Elites, Mimic
- [ ] EnemyDef/AttackDef loader + validator
- [ ] AI state machine, move styles, special budget, aggro, swarms, front guards, on-death, summons, spawn tells
- [ ] 8 Elite affixes
- [ ] 8 Mossy Crypt enemies with draw functions
- [ ] Mimic
- [ ] scaling formulas
- [ ] tests; browser check

## M4 — Procgen, rooms, waves, chests, bonfires, minimap, zone flow
- [ ] layout generator, specials placement, boss anteroom/room
- [ ] 10 Crypt templates, interior rules, validation
- [ ] mix picker, threat budgets, waves, ambush rooms, room clear
- [ ] chests, reliquary room, merchant room shell, bonfires (ids), stairs, title cards
- [ ] minimap + map screen, room transitions
- [ ] tutorial hall + The Instructor (drop stubbed)
- [ ] death screen, Shardpile, respawn, first-rest rule
- [ ] tests; browser check

## M5 — Items, loot, inventory, gems, Stardust, shop
- [ ] item generator (rarity, slot, ilvl, affixes, sockets, legendaries, names, flavor)
- [ ] drops + instancing hooks, pickups, loot beams
- [ ] inventory/character screen, requirements penalties, tooltips, quick swap
- [ ] armor sets, rings
- [ ] gems: socket/unsocket/upgrade/re-roll, Stardust, selling
- [ ] bonfire menu: rest (first-rest rule), level up, respec, gem bench, shop, warp
- [ ] consumables + quick-use
- [ ] Instructor drop real
- [ ] tests; browser check

## M6 — 16 weapon classes, 48 skills, casting, 28 spells
- [ ] all WeaponDefs + draw functions
- [ ] all skills + unlock tiers + cooldown UI
- [ ] casting tools, spell loadout screen, school/requirement locks
- [ ] 14 Brain spells, 14 Prayer spells, reliquaries
- [ ] EffectDef system
- [ ] tests; browser check

## M7 — Classes, creation, title, slots, settings, screens
- [ ] 10 classes
- [ ] title, save slots (10), export/import, delete
- [ ] character creation with seed + preview
- [ ] settings: video, audio, rebinding (kb + pad), accessibility, aim assist, hold/toggle block
- [ ] pause menu, autosave schedule, migrations, beforeunload
- [ ] tests; browser check

## M8 — Boss framework, Caretaker, Zones 2–3
- [ ] BossDef phases, boss bar, intro, lock, drops, bosses-beaten → flask
- [ ] The Caretaker
- [ ] Fungal Caverns: 8 enemies, 10 templates, hazards, Mother Spore
- [ ] Drowned Sewers: 8 enemies, 10 templates, water/grates/Flood, The Bloatking
- [ ] stairs + zone transitions
- [ ] tests; browser check (zones 1–3 end to end)

## M9 — Online co-op
- [ ] Trystero adapter + Loopback, lobby, room codes, version check
- [ ] inputs, snapshots, keyframes, events, commands
- [ ] prediction/reconciliation, interpolation
- [ ] authority split, instanced loot/Shards, HP scaling
- [ ] downed/ghost/revive-by-attack, Last Rites, Ghost Lantern, wipe
- [ ] per-player first-rest, progress credit, advance-to-zone on solo load
- [ ] player cards, return to lobby, disconnects, ?net=test
- [ ] loopback tests, Playwright join; real two-window check

## M10 — Zones 4–5
- [ ] Hollow Forest: enemies, templates, hazards, Vexthorn
- [ ] Ashen Forge: enemies, templates, hazards, Foreman Ignatius

## M11 — Zones 6–7
- [ ] Frozen Reliquary: enemies, templates, hazards, Saint Aurelia
- [ ] Clockwork Citadel: enemies, templates, hazards, Archmagister Tock

## M12 — The Abyss, The Landlord, credits, NG+
- [ ] Abyss enemies, templates, void edges, Hollow Joes
- [ ] The Landlord (3 phases, shrinking platform)
- [ ] credits, NG+ bonfire and cycle scaling

## M13 — Gary, reliquaries, merchant room, no-refill test, Tears, rings/legendaries verified
- [ ] all items

## M14 — Audio and VFX pass
- [ ] full sound list, zone music, boss music, VFX list, intro cards, colorblind/high-contrast, juice

## M15 — Balance, performance, QA
- [ ] Shard tuning test green, simulation harness + BALANCE_REPORT.md, 60 fps profile, leak check, Playwright regression

## M16 — Deploy, docs, handoff
- [ ] README final, OWNER_CHECKS.md, TODO.md empty/justified, workflow green, live URL confirmed
