# Dungeon Joe — Build Brief (one session, no phases)

This is the complete instruction set for building Dungeon Joe. It is executed by Claude Code (Opus) in
**one session**, top to bottom. There are no owner-gated phases (D26). If the session ends before the end,
the next session reads `docs/PROGRESS.md` and continues from the first unchecked item. **Everything in
this brief is in scope. Nothing is cut.** If something must be deferred within a session, it is written
to `docs/TODO.md` with a reason and picked up before the build is called done.

## 0. Rules of engagement

1. **Read first, in this order:** `CLAUDE.md`, this file, `DECISIONS.md`, `GAME_DESIGN.md`,
   `DATA_MODEL.md`, `PROCGEN.md`, `NETCODE.md`, `ART_AUDIO.md`, then the content files
   (`CONTENT_ENEMIES.md`, `CONTENT_ITEMS.md`, `CONTENT_SPELLS_CLASSES.md`) as each milestone needs them.
2. **Do not re-decide decided things.** If a decision is impossible or clearly wrong, note it in
   `DECISIONS.md` as a new row ("D-next: … *changed during build because …*"), pick the closest
   workable option, and keep going. Do not stop to ask; the owner is not watching the session.
3. **Verify current library docs** before using them: Trystero (strategy modules, `joinRoom`, `makeAction`),
   Vite (`base`, GitHub Pages), Vitest, Playwright, the Gamepad API. Pin exact versions in
   `package.json`.
4. **Commit at every milestone** (`feat(m3): enemy framework + Crypt roster`), push after each commit.
   Create the GitHub repo at M0 (D27). Branch `main` only.
5. **Playtest in the browser** at the end of every milestone from M2 on: start `npm run dev` with the
   desktop app's `preview_start` and use the hidden debug menu to jump around. Record what was checked in
   `PROGRESS.md`. A milestone is not done until its "done when" is true *in the browser*, its tests pass,
   `npm run typecheck` and `npm run lint` are clean.
6. **Use subagents** for parallelisable content work (e.g. four agents each authoring two zones' enemy
   tables, draw functions and room templates from the content docs), but integrate and test in the main
   session. Each subagent gets the exact doc sections to implement and the TypeScript interfaces.
7. **Data over code.** Every enemy, boss, weapon, skill, spell, gem, affix, class, zone and room
   template is a table in `src/data`. The engine reads tables; nothing content-specific is hard-coded
   in systems.
8. **No `Math.random()` in `src/game`** (seeded streams only, PROCGEN §1). No external fonts, images or
   audio files (D8, D13). No frameworks. No game engines.
9. Keep `docs/` current: when a number changes during tuning, change the doc number too and say
   "(tuned)" next to it.
10. The owner works on **Windows 11 / PowerShell 5.1**. Any command given to the owner is an exact
    PowerShell command (no `&&`).
11. `docs/OWNER_PRIVATE.md` is **git-ignored** and must never be committed or printed in a commit
    message, PR, README or log. The debug code's SHA-256 is already in §6 (M1); use it, never the
    plaintext.

## 1. What the owner has already done (SETUP_CHECKLIST.md)

Folder renamed to `C:\dev\DungeonJoe`; Node 24 LTS, Git 2.55, GitHub CLI 2.102 installed; `gh auth login`
done as `roamingjackmans-pixel`; the user Pages site `roamingjackmans-pixel.github.io` serves
`https://josephjackman.com/` (CNAME set, HTTPS enforced), and sibling projects already deploy at
`https://josephjackman.com/<repo>/` (e.g. `horserace`, `thedeck`). The `DungeonJoe` repo does **not** exist
yet. First action of the build: verify all of this (`node -v`, `gh auth status`, folder path) and stop with
a clear message only if something is missing.

## 2. Target

A static web game at `https://josephjackman.com/games/dungeonjoe/` that fully implements GAME_DESIGN.md with
all content in the content docs: 8 zones, 64 enemies, Elite affixes, 8 bosses (final with 3 phases),
the tutorial hall with The Instructor, 16 weapon classes × 3 skills, 8 shields, 9 casting tools, 24
armor sets, rings, affixes, legendary powers, 12 gem families × 5 tiers, consumables, 28 spells, 10
classes, bonfires with the first-rest rule, shops and Gary, mimics, procedural zones, souls-style
death, NG+, 10 save slots with export/import, settings with rebinding, synthesized audio, and 4-player
online co-op over Trystero with the attack-to-revive rule, instanced loot and guest progress credit.

## 3. Repository layout

```
C:\dev\DungeonJoe\
  CLAUDE.md  README.md  package.json  vite.config.ts  tsconfig.json  eslint.config.js  vitest.config.ts
  playwright.config.ts  index.html  .gitignore  .editorconfig  .gitattributes  .nvmrc (24)
  .github/workflows/deploy.yml        # build + deploy to GitHub Pages on push to main
  public/                             # favicon.svg (drawn), 404.html (redirect to base)
  src/
    main.ts                           # boot: settings, audio unlock, scene manager
    engine/   loop.ts canvas.ts input/(keyboard, mouse, gamepad, bindings) rng.ts math.ts
              draw/(parts, enemies/, players, weapons, telegraphs, fx) audio/(mixer, sfx, music)
              particles.ts text.ts tween.ts
    game/     world.ts (ECS-lite) systems/(movement, stamina, statuses, ai, attacks, telegraphs,
              projectiles, hits, damage, loot, rooms, waves, bosses, pickups, interact, revive, net)
              combat/(formulas, scaling, requirements, patterns) player/ enemies/ bosses/
              procgen/(zone, rooms, mix, waves, chests) items/(generate, affixes, gems, naming)
              spells/ skills/ bonfire/(rest, levelup, shop, gembench, warp) save/(schema, migrations,
              storage, exportImport) net/(trystero, loopback, host, guest, protocol, snapshots)
              scenes/(title, slots, create, lobby, run, death, credits) debug/(menu, hash)
    data/     zones.ts enemies/<zone>.ts bosses/<name>.ts rooms/<zone>.ts weapons.ts skills.ts
              shields.ts castingTools.ts armor.ts rings.ts affixes.ts legendaries.ts gems.ts
              consumables.ts spells.ts classes.ts lootTables.ts flavor.ts validate.ts
    ui/       hud.ts minimap.ts bossBar.ts menus/(pause, inventory, character, spells, map, settings,
              bindings, shop, gembench, bonfire, lobby, debug) tooltip.ts strings.ts theme.css
  tests/      unit (vitest) + e2e (playwright)
  docs/       this folder (kept current), PROGRESS.md, TODO.md, OWNER_CHECKS.md
```

## 4. Tooling

- `npm create vite@latest` (vanilla-ts) then strip the template. `vite.config.ts`: `base: '/games/dungeonjoe/'`,
  `build.target: 'es2022'`, sourcemaps on. `tsconfig`: `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`.
- ESLint (typescript-eslint, a custom rule or `no-restricted-properties` banning `Math.random` under
  `src/game` and `src/data`), Prettier.
- Vitest for unit tests (node environment; canvas and audio are never imported by game logic).
- Playwright (chromium) for: boot smoke, character creation → tutorial → first room; two-context co-op
  join through `LoopbackTransport` exposed on `window` under `?net=test`.
- Scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:e2e`, `validate:data`, `deploy`
  (prints the Pages URL; the real deploy is the workflow).
- `.github/workflows/deploy.yml`: on push to `main`: `npm ci`, `npm run typecheck`, `npm test`,
  `npm run build`, upload `dist/`, `actions/deploy-pages`. Mirror the pattern the owner's `horserace`
  repo uses if it has a workflow (`gh repo view roamingjackmans-pixel/horserace`), otherwise the standard
  `actions/configure-pages` + `upload-pages-artifact` + `deploy-pages` trio. `public/404.html` redirects
  deep links to the base path.
- `.gitignore`: `node_modules`, `dist`, `.env*`, `docs/OWNER_PRIVATE.md`, Playwright reports, OS junk.

## 5. Build order (milestones)

Each milestone: **Build** (what to write), **Tests**, **Done when** (verified in the browser or by tests).
Tick them in `docs/PROGRESS.md` as they finish, with the commit hash.

### M0 — Repo, tooling, deploy pipeline
Build: scaffold per §3–4; `index.html` with the canvas and overlay root; a placeholder scene that draws
"Dungeon Joe" and a bouncing Joe; `README.md` (what it is, how to run, how to deploy, controls, known
limits); `.gitignore` first, then `git init -b main`, first commit, `gh repo create DungeonJoe --public
--source . --push`, workflow committed. Tell the owner (in PROGRESS.md and the final message) to set
**Settings → Pages → Source: GitHub Actions** on the new repo once; the workflow then publishes to
`https://josephjackman.com/games/dungeonjoe/`.
Tests: vitest smoke; Playwright boot smoke.
Done when: `npm run dev` shows the placeholder; the repo exists on GitHub; the workflow file is in place.

### M1 — Engine core
Build: fixed-step loop with interpolation; canvas scaling/letterbox/DPR/fullscreen; input layer
(keyboard, mouse with cursor position in logical px, Gamepad API with deadzones, **bindings** table,
"action" abstraction producing an `InputFrame` per tick); seeded RNG streams; math (vectors, arcs,
segment-circle, cone tests); scene manager; particle pool; tween; text drawing; draw-parts library
(bodies, outlines, glow pre-render); audio mixer + `Sfx` synth with a first 10 sounds + autoplay unlock;
settings persistence; the **debug menu** (Ctrl+Shift+D → code prompt; `SHA-256(code) ===
"1bdbba686a80685b2d3e388d26fb8067c33b4392d8029716f32f4c61af2fb24e"` using `crypto.subtle`; on success a
DOM panel: god mode, give item (base, rarity, ilvl), set level, set stat, spawn enemy by id, kill all,
jump to zone/room/boss, set cycle, set flask, add Shards/Stardust, toggle hitbox/telegraph/AI
overlays, show FPS and entity counts).
Tests: rng determinism, math, bindings serialisation, hash check.
Done when: a test scene lets Joe walk with WASD and gamepad, aims at the cursor, and the debug menu opens
with the code and refuses a wrong code.

### M2 — Player, combat core, telegraph system
Build: `World` ECS-lite and the system order (DATA_MODEL §4); player movement; stamina; **dodge** (0.45 s,
220 px, i-frames 0.05–0.40, one charge, 5 s recharge ring); light-attack combos driven by `WeaponDef`
(start with Longsword, Greathammer, Twin Daggers, Bow for coverage: slow, fast, ranged); hitboxes (arc,
thrust, projectile); **block** with shield values, stability, guard break; **parry** windows and riposte
state; **two-hand** toggle with ×1.5 stats and weapon guard; damage pipeline with types, defenses,
statuses (all five) and meters; poise and stagger; hitstop and shake; damage numbers; **pattern
primitives** (all of GAME_DESIGN §5.7) with telegraph drawing and hit tests; the **Red** and **Piercing**
rules (block fails and guard-breaks on Red; i-frames ignored on Piercing); the escapability test
helper; HUD v1 (HP, stamina, statuses, dodge ring, skills/spells placeholders).
Tests: formulas (HP/stamina curves, scaling f(s), damage, requirements), dodge i-frame vs Red and
Piercing, parry window, guard break, status triggers, each pattern's hit test against known points.
Done when: in a test arena with a scripted dummy that performs a normal, a Red and a Piercing attack, all
three behave per GAME_DESIGN §5.4–5.6, and the greathammer feels heavy, the daggers fast.

### M3 — Enemy framework + Zone 1 roster + Elites + Mimic
Build: `EnemyDef`/`AttackDef` loader and validator; AI state machine with move styles, preferred range,
attack selection with weights, cooldowns and the room-wide **special budget**; aggro table; swarm
groups; front guards; on-death effects; summons; spawn tells; **Elite** affixes (all 8) with visuals
and drops hook; the 8 **Mossy Crypt** enemies with draw functions; the **Mimic** (chest, tells, bite
kills/downs, wake on attack); enemy scaling formulas by zone/cycle/players.
Tests: data validation (CONTENT_ENEMIES §13 items 1–4), AI never exceeds the budget, elite rate 8% ± 1.
Done when: via the debug menu, each Crypt enemy and each Elite affix can be spawned and fights
correctly in the test arena; a mimic bites when opened and fights when attacked.

### M4 — Procgen, rooms, waves, chests, bonfires, minimap, zone flow
Build: PROCGEN §2–§7 fully (layout, interiors with 10 Crypt templates, mix picker, threat budgets,
waves, ambush rooms, clears, chests, reliquary, merchant room shell, bonfires with ids, stairs, zone
title cards, minimap, map screen); the room transition camera (door walk-through, 0.3 s fade); the
**tutorial hall** with stations and The Instructor (its drop uses the item generator from M5, stub
until then); Shardpile on death; death screen; respawn at bonfire with the first-rest rule.
Tests: PROCGEN §9.
Done when: a new character walks the tutorial, reaches the start bonfire, clears Crypt rooms with
waves, finds the treasure room, dies, recovers the Shardpile, rests (first rest heals; second does
not), and the boss anteroom bonfire exists (boss door locked until M8).

### M5 — Items, loot, inventory, gems, Stardust, shop
Build: item generation (rarity tables per source, slot roll, ilvl, affixes with ranges, sockets,
legendary powers, names, flavor); drop logic incl. instancing hooks (player-keyed streams); pickups
and loot beams; **inventory/character screen** (60-slot bag, equip with requirement checks and the
40%/locked/half/no-cast penalties, compare tooltips, two-weapon quick swap, ring slots, two-hand
state); armor sets and defense; **gems** (all families, tiers, socket/unsocket, upgrade and re-roll
costs), Stardust, sell values; **bonfire menu** (rest, level up with cost curve and stat buttons,
respec with Tears, gem bench, shop with throwables, T1 gem, rotating piece, warp);
consumables and the quick-use slot; the Instructor's real drop.
Tests: generator distributions (rarity weights within 1% over 100k rolls), affix no-duplicates,
requirement penalties, level cost curve, Stardust math, save round-trip of items.
Done when: loot drops in rarities, equips with tooltips, gems change attack speed visibly, the shop
and gem bench work, leveling works, and the inventory survives reload.

### M6 — All 16 weapon classes, 48 skills, casting, 28 spells
Build: every `WeaponDef` with combos and draw functions; every skill from CONTENT_ITEMS §4.1 with
cooldown UI on Q/E/R; skill unlock by tier (+1 Legendary); casting tools with grades and cast speed;
spell loadout screen (3 slots, school lock, requirement lock); all 14 Brain and 14 Prayer spells
with effects (Blink escapes Piercing by position; Last Rites revive value; Sanctuary etc.); spell
reliquaries grant unknown spells; the effect system (`EffectDef`) shared by skills, spells, consumables
and legendary powers.
Tests: CONTENT_SPELLS_CLASSES §4; every skill and spell has an effect that resolves without error in a
headless world; cooldown reduction cap 50%; attack speed cap ×1.6.
Done when: each weapon class can be given via debug, feels distinct, all three skills work; each spell
casts from the right tool and refuses the wrong one.

### M7 — Classes, character creation, title, save slots, settings, death/credits screens
Build: 10 classes with starting kits; title screen; 10 save slots with cards (name, class, level,
zone, cycle, playtime), delete with confirm, export/import; character creation with seed field and
vector preview; settings (video, audio, controls rebinding for keyboard and gamepad with conflict
detection, accessibility, aim assist, hold/toggle block); pause menu; autosave schedule;
migrations scaffold; `beforeunload` save.
Tests: save schema validation, migration from a fixture, import rejects bad files, bindings
round-trip.
Done when: a new character of each class starts with the right gear and spells; saves persist across
reloads; export → import restores a character to a different slot.

### M8 — Boss framework + Caretaker + Zones 2–3 (rosters, rooms, bosses)
Build: `BossDef` with phases (transition invulnerability, speed/damage multipliers, new attacks, arena
changes, summons), boss bar with phase tick, intro card, boss room lock, drops (Rare+,
gem, 25% reliquary spawn, 10% Tear), bosses-beaten counter → flask max; **The Caretaker**; Fungal
Caverns and Drowned Sewers: 16 enemies, 20 room templates, hazard tiles (poison pools, water, grates,
Flood), **Mother Spore**, **The Bloatking**; stairs and zone transition for real.
Tests: CONTENT_ENEMIES §13 item 5 for these bosses; phase transition at exactly 50%.
Done when: zones 1–3 are playable end to end; each boss has two visibly different phases.

### M9 — Online co-op
Build: NETCODE.md in full: Trystero adapter + Loopback; lobby scene with room codes; hello/welcome
with version check; input packets; snapshots and keyframes; events and commands; guest prediction and
reconciliation; interpolation; authority split; per-player loot and Shards; HP scaling on join/leave;
**downed/ghost/revive-by-attack** with weapon revive values, doubling requirement (cap ×4), Last Rites,
Ghost Lantern, 30 s bleed-out, party wipe; per-player first-rest rule; progress credit (D31) and the
guest-side "advance to zone" on next solo load; player cards in the HUD; chat line (optional, text only);
"Return to lobby"; disconnect handling; the `?net=test` dual pane.
Tests: loopback host + 3 guests through a scripted fight (vitest); Playwright two-context join.
Done when: two browser windows on this PC join via a real room code over Trystero, see each other,
fight, one goes down and is revived by hits, loot is instanced, and the guest keeps its loot after the
host leaves.

### M10 — Zones 4–5 (Hollow Forest, Ashen Forge)
Build: 16 enemies, 20 templates, hazards (thorns, traps, fire puddles, Fire Wall, lava channel, oil
ignites), **Vexthorn**, **Foreman Ignatius** (two-target phase 2).
Done when: zones 4–5 playable with their bosses; all validation tests green.

### M11 — Zones 6–7 (Frozen Reliquary, Clockwork Citadel)
Build: 16 enemies, 20 templates, hazards (ice patches, Silence, Time Bubbles, laser sweeps, rotating
floor), **Saint Aurelia**, **Archmagister Tock** (corner turrets, rewind volleys).
Done when: zones 6–7 playable with their bosses.

### M12 — The Abyss, The Landlord (3 phases), credits, NG+
Build: 8 enemies, 10 templates, void edge falls, Hollow Joes drawn from the player's draw function,
**The Landlord** with three phases and the shrinking platform; credits; NG+ bonfire and cycle
scaling (enemies, Shards, ilvl, no tutorial, better stock); title shows the cycle.
Done when: the whole game can be completed and NG+ started; the Landlord's phases trigger at 66/33%.

### M13 — Gary, reliquaries, elites polish, merchant room, Tears
Build: the wandering merchant room with Gary (stock rules, leaving when attacked, nearly unkillable),
rotating bonfire stock re-roll on rest, the "no flask refills" data test (GAME_DESIGN §9.2), Tear sources, Lucky
Charm, all rings and legendary powers verified in play.
Done when: Gary appears in some zones with the listed stock; every ring and legendary power has an
observable effect.

### M14 — Audio and VFX pass
Build: the full sound list, zone ambient music, boss music with phase voice, mixer and settings;
all VFX in ART_AUDIO §4; boss intro cards; colorblind icons and high-contrast telegraphs; juice tuning
(hitstop/shake per weapon).
Done when: every action listed in ART_AUDIO §5 has a sound; music changes per zone and boss phase.

### M15 — Balance, performance, QA
Build: run the Shard-tuning test and fix tables; a headless **simulation harness** that runs scripted
bots (greathammer, daggers, caster, cleric) through each zone 50 times and reports deaths per zone,
time per boss, Shards per zone, drops per zone; tune to GAME_DESIGN targets (first clear ~3–4 hours
for a competent player; zone deaths rising gently; bosses 2–5 attempts); performance profile with 12
enemies + 4 players + 300 particles at 60 fps on an integrated-GPU laptop (use `performance.now()`
budgets and an on-screen frame graph in the debug menu); memory leak check over 30 minutes of room
transitions; Playwright regression suite; fix everything found.
Done when: all tests green, the harness report is committed under `docs/BALANCE_REPORT.md`, 60 fps holds.

### M16 — Deploy, docs, handoff
Build: `README.md` final; `docs/OWNER_CHECKS.md` (a play checklist for the owner: 25 things to try,
each one sentence); `docs/PROGRESS.md` all ticked; `docs/TODO.md` empty or justified; push; confirm the
workflow run is green (`gh run list`); confirm `https://josephjackman.com/games/dungeonjoe/` loads (the
owner must have set Pages → Source: GitHub Actions; if the site 404s, say so in the final message).
Done when: the live URL plays the game.

## 6. Quality bar (applies throughout)

- `npm run typecheck`, `npm run lint`, `npm test` clean at every commit; `npm run build` under 2 MB gz.
- Unit tests for all formulas, generators, data validation, save/migrations, netcode via loopback.
- Playwright: boot, create character, tutorial to first room, co-op join (loopback), save round-trip.
- Every content table validated at startup in dev and by `npm run validate:data`.
- No console errors in a full solo run (the harness and Playwright assert this).
- Frame budget: simulation ≤ 4 ms, render ≤ 8 ms at 1280×720 on a mid laptop.
- Accessibility: all menus keyboard/gamepad navigable; telegraph icons; rebinding; shake/hitstop toggles.

## 7. Session continuation protocol

At the start of any session: read `CLAUDE.md`, `docs/PROGRESS.md`, `docs/TODO.md`, `git log --oneline
-20`, run `npm test`, then continue at the first unchecked milestone item. At the end of a session (or
when context is getting long): update `PROGRESS.md` with exactly where things stand and what was
verified, commit and push, and write a 10-line "next session starts here" note at the top of
`PROGRESS.md`.

## 8. Final message to the owner

When M16 is done, the final message states: the live URL, the one Pages setting the owner must have
set, how to run locally (PowerShell), how to host and join a co-op game, where the debug menu is (not
the code), the known limits, and the path to `docs/OWNER_CHECKS.md`.
