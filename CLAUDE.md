# CLAUDE.md — Dungeon Joe

Dungeon Joe is a browser souls-like (Dark Souls / Salt and Sanctuary rules) that plays like Hades, The
Binding of Isaac and Diablo 3: top-down procedurally generated arena rooms, six stats (HP, Stamina, Bonk,
Slicey, Brain, Prayer), weapons with three cooldown skills, spells on staffs and talismans, bonfires and a
flask, red (unblockable) and blue (piercing, un-dodgeable) attacks, loot rarities and gems, mimics, ten
classes, ten save files, New Game+, and four-player online co-op. Hosted at
`https://josephjackman.com/games/dungeonjoe/` on GitHub Pages.

## How we work

- **One build, no phases.** `docs/BUILD_BRIEF.md` is the whole plan; execute it top to bottom, ticking
  `docs/PROGRESS.md`. A new session continues from the first unchecked item (BUILD_BRIEF §7).
- The owner is **not watching**. Do not stop to ask. Pick the closest workable option, record it in
  `docs/DECISIONS.md`, keep going.
- Commit and push at every milestone on `main`. Conventional messages (`feat(m4): …`, `fix:`, `test:`,
  `docs:`, `chore:`).
- The owner works on **Windows 11 + PowerShell 5.1**: any command you give them is exact PowerShell
  (chain with `;`, never `&&`). Project path `C:\dev\DungeonJoe`.
- Never commit, print or paste `docs/OWNER_PRIVATE.md` (git-ignored). The debug code is only ever
  compared by SHA-256.

## Source of truth (read in this order)

1. `docs/BUILD_BRIEF.md` — the build order, tooling, quality bar, continuation protocol
2. `docs/DECISIONS.md` — every locked decision (D1–D40) and why
3. `docs/GAME_DESIGN.md` — rules, formulas, controls, combat, loot, bonfires, co-op, NG+, UI
4. `docs/DATA_MODEL.md` — save schema, item schema, data-table interfaces, ECS components
5. `docs/PROCGEN.md` — zone/room generation, waves, chests, determinism
6. `docs/NETCODE.md` — Trystero host-authoritative co-op, messages, prediction, authority
7. `docs/ART_AUDIO.md` — vector art, telegraph look, VFX, synthesized audio, UI theme
8. `docs/CONTENT_ENEMIES.md` — 64 enemies, Elites, Mimic, Gary, The Instructor, 8 bosses
9. `docs/CONTENT_ITEMS.md` — weapons, skills, shields, casting tools, armor, rings, affixes, gems, consumables, loot tables
10. `docs/CONTENT_SPELLS_CLASSES.md` — 28 spells, 10 classes

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
npm run test:e2e     # Playwright (boot, create character, tutorial, loopback co-op join, save round-trip)
npm run validate:data
```
