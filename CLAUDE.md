# CLAUDE.md — Dungeon Joe

Dungeon Joe is a browser souls-like (Dark Souls / Salt and Sanctuary rules) that plays like Hades, The
Binding of Isaac and Diablo 3: top-down procedurally generated arena rooms, six stats (HP, Stamina, Bonk,
Slicey, Brain, Prayer), weapons with three cooldown skills, spells on staffs and talismans, bonfires and a
flask, red (unblockable) and blue (piercing, un-dodgeable) attacks, loot rarities and gems, mimics, ten
classes, ten save files, New Game+, and four-player online co-op. Hosted at
`https://josephjackman.com/games/dungeonjoe/` on GitHub Pages.

## How we work

- The original build (`docs/BUILD_BRIEF.md`, ticked off in `docs/PROGRESS.md`) is done; work now comes from the
  owner's requests.
- The owner is **not watching**. Do not stop to ask. Pick the closest workable option, record it in
  `docs/DECISIONS.md`, keep going.
- Commit and push at every milestone on `main`. Conventional messages (`feat(m4): …`, `fix:`, `test:`,
  `docs:`, `chore:`).
- The owner works on **Windows 11 + PowerShell 5.1**: any command you give them is exact PowerShell
  (chain with `;`, never `&&`). Project path `C:\dev\DungeonJoe`.
- Never commit, print or paste `docs/OWNER_PRIVATE.md` (git-ignored). The debug code is only ever
  compared by SHA-256.

## Source of truth (read in this order)

The design docs below describe the game **as it is now**: when you change a rule, update the doc that states it as
well as adding a decision. `docs/DECISIONS.md` is the history of why (D1 onward; its "Superseded" index lists which
decisions later ones replaced). Where a doc and the code disagree, the code is the truth and the doc needs fixing.

1. `docs/GAME_DESIGN.md` — rules, formulas, controls, combat, loot, gems, bonfires, co-op, NG+, UI
2. `docs/CONTENT_ENEMIES.md` — enemies, Elites, Mimic, Gary, The Instructor, bosses and their phases
3. `docs/CONTENT_ITEMS.md` — weapons, skills, shields, casting tools, armor, rings, affixes, gems, set perks, consumables, loot tables
4. `docs/CONTENT_SPELLS_CLASSES.md` — spells, classes
5. `docs/DATA_MODEL.md` — save schema, item schema, data-table interfaces, ECS components
6. `docs/PROCGEN.md` — zone/room generation, waves, chests, determinism
7. `docs/NETCODE.md` — Trystero host-authoritative co-op, messages, prediction, authority
8. `docs/ART_AUDIO.md` — vector art, telegraph look, VFX, synthesized audio, UI theme
9. `docs/DECISIONS.md` — every decision and why, in order (history)
10. `docs/BUILD_BRIEF.md` / `docs/PROGRESS.md` — the original build plan and log (history)
11. `docs/balance/report.md` — generated balance numbers and ranked findings (`npm run balance:report`)

## Stack (locked, D6–D8, D13)

Vite + TypeScript strict · Canvas 2D · no framework, no engine · Trystero (WebRTC) · Web Audio
synthesis · Vitest · Playwright · GitHub Actions → GitHub Pages (`base: '/games/dungeonjoe/'`).

## Rules that are easy to break

- No `Math.random()` in `src/game` or `src/data` (seeded streams, PROCGEN §1).
- No external fonts, images, audio or CDN scripts. Everything is drawn or synthesized in code.
- Content is data (`src/data/*`); systems never special-case an enemy or item by id.
- No attack is both Red and Piercing. Every Piercing area is escapable (test in CONTENT_ENEMIES §13).
- Bonfires heal and refill the flask on every rest (D150; was the first rest only, D38); dying refills it; nothing else ever does.
- Weapon scaling grades are spread from E to S on purpose (D40); do not flatten them.
- Guests own their inventory; the host owns the world (NETCODE §6).

## Commands (keep current; fill in at M0)

```powershell
npm run dev          # Vite dev server (preview it in the desktop app's browser pane)
npm run build        # production build to dist/ (deployed by .github/workflows/deploy.yml)
npm run preview      # serve dist/ locally under /games/dungeonjoe/
npm run typecheck; npm run lint; npm test
npm run test:e2e     # Playwright in Chromium and Firefox (boot, create character, tutorial, loopback co-op join, save round-trip)
npx playwright install chromium firefox   # once, before the first e2e run
npm run validate:data
npm run balance:report   # regenerate docs/balance/report.md (about 1 s): curves, time-to-kill, gems, weapons, spells, ranked findings
npm run balance          # slower bot campaigns (docs/balance/campaigns.md, curated in docs/BALANCE_REPORT.md)
```
