# Dungeon Joe — Build progress

> **Next session starts here:** M0–M7 done. Continue at M8 (boss framework, then the Caretaker, Mother Spore, the Bloatking).
> Dev: npm run dev → http://localhost:5173/games/dungeonjoe/?debug (or ?arena, ?new&class=cleric&seed=X). For long scripted playtests use the no-HMR server (vite.stable.config.ts, port 5174) and window.__dj.loop.advance(s).

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
- [x] EnemyDef/AttackDef loader + validator — 6028d79 2026-11-02
- [x] AI state machine, move styles, special budget, aggro, swarms, front guards, on-death, summons, spawn tells — 6028d79 2026-11-02
- [x] 8 Elite affixes — 6028d79 2026-11-02
- [x] 8 Mossy Crypt enemies with draw functions — 6028d79 2026-11-02
- [x] Mimic — 6028d79 2026-11-02
- [x] scaling formulas — 6028d79 2026-11-02
- [x] tests; browser check — 6028d79 2026-11-02 — 12 enemy tests (validation, budget ≤ 2 over 30 s with 12 enemies, elite rate 8%±1, each Crypt enemy fights and dies, Raise Dead, mimic dormant/wake/bite). Browser: all 8 Crypt enemies + mimic + Arcane/Shielded elites rendered and fighting in the arena.

## M4 — Procgen, rooms, waves, chests, bonfires, minimap, zone flow
- [x] layout generator, specials placement, boss anteroom/room — 0949d39 2026-11-02
- [x] 10 Crypt templates, interior rules, validation — 0949d39 2026-11-02
- [x] mix picker, threat budgets, waves, ambush rooms, room clear — 0949d39 2026-11-02
- [x] chests, reliquary room, merchant room shell, bonfires (ids), stairs, title cards — 0949d39 2026-11-02
- [x] minimap + map screen, room transitions — 0949d39 2026-11-02
- [x] tutorial hall + The Instructor (drop stubbed) — 0949d39 2026-11-02
- [x] death screen, Shardpile, respawn, first-rest rule — 0949d39 2026-11-02
- [x] tests; browser check — 0949d39 2026-11-02 — procgen (1,000 seeds × 8 zones, reachability, dead-end boss, mixes, ≤ 12 live, mimic 5%±0.5%, Shard tuning zone 1), session tests. Browser (no-HMR server on 5174): hall → start bonfire; first rest 240/240 + flask, second rest nothing; combat room locks, waves, clears; death → pile 621 → respawn full → recovered 621; treasure chest; anteroom bonfire + locked boss door. Fixed: negative spawn-tell radius on 1.5 s tells.

## M5 — Items, loot, inventory, gems, Stardust, shop
- [x] item generator (rarity, slot, ilvl, affixes, sockets, legendaries, names, flavor) — 8a7d2fd 2026-11-02
- [x] drops + instancing hooks, pickups, loot beams — 8a7d2fd 2026-11-02
- [x] inventory/character screen, requirements penalties, tooltips, quick swap — 8a7d2fd 2026-11-02
- [x] armor sets, rings — 8a7d2fd 2026-11-02
- [x] gems: socket/unsocket/upgrade/re-roll, Stardust, selling — 8a7d2fd 2026-11-02
- [x] bonfire menu: rest (first-rest rule), level up, respec, gem bench, shop, warp — 8a7d2fd 2026-11-02
- [x] consumables + quick-use — 8a7d2fd 2026-11-02
- [x] Instructor drop real — 8a7d2fd 2026-11-02
- [x] tests; browser check — 8a7d2fd 2026-11-02 — 14 item tests (rarity weights within 1% over 100k for 6 sources, no duplicate affixes, penalties, Quicksilver attack speed and the ×1.6 cap, gems/Stardust math, level curve, respec, save round-trip). Browser: 4 rooms cleared → 8 drops in common/uncommon/rare + gems; inventory + tooltip; ring equipped (HP 240→282); bonfire level 1→2; Quicksilver T5 socketed → attack speed 1.00→1.18; shop purchase; all of it survived a reload.

## M6 — 16 weapon classes, 48 skills, casting, 28 spells
- [x] all WeaponDefs + draw functions — 7d61843 2026-11-02
- [x] all skills + unlock tiers + cooldown UI — 7d61843 2026-11-02
- [x] casting tools, spell loadout screen, school/requirement locks — 7d61843 2026-11-02
- [x] 14 Brain spells, 14 Prayer spells, reliquaries — 7d61843 2026-11-02
- [x] EffectDef system — 7d61843 2026-11-02
- [x] tests; browser check — 7d61843 2026-11-02 — 50 skill/spell tests (data rules, every class kit valid, all 48 skills and 28 spells resolve headless, CDR ≤ 50%, attack speed ≤ ×1.6, school/tool locks, spell power from Brain + tool). Browser (arena): all 16 weapons given via debug at Legendary ilvl 7, every Q/E/R fired; damaging skills hit (e.g. Earthshaker 984, Meteor Lunge 1118, Charged Swing 1490), buffs applied; staff spells cast (Arcane Bolt, Meteor, Chain Lightning), talisman Heal healed, two-handing refused to cast.

## M7 — Classes, creation, title, slots, settings, screens
- [x] 10 classes — 0bdcc8c 2026-11-02 (kits checked in browser against CONTENT_SPELLS_CLASSES §3)
- [x] title, save slots (10), export/import, delete — 0bdcc8c 2026-11-02
- [x] character creation with seed + preview — 0bdcc8c 2026-11-02
- [x] settings: video, audio, rebinding (kb + pad), accessibility, aim assist, hold/toggle block — 0bdcc8c 2026-11-02
- [x] pause menu, autosave schedule, migrations, beforeunload — 0bdcc8c 2026-11-02
- [x] tests; browser check — 0bdcc8c 2026-11-02 (tests/unit/save.test.ts; create → reload → slots → export/import into slot 3 → pause → settings)

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
