# Dungeon Joe

A browser souls-like with the pace of Hades, the rooms of The Binding of Isaac and the loot of Diablo 3.
Six stats (HP, Stamina, Bonk, Slicey, Brain, Prayer), weapons with three cooldown skills, spells on staffs
and talismans, bonfires and a flask, red attacks you cannot block and blue attacks you cannot dodge,
mimics, gems, ten classes, ten save files, New Game+, and four-player online co-op.

Lives at `https://josephjackman.com/DungeonJoe/` (GitHub Pages).

**Status:** in development (see `docs/PROGRESS.md`). The design package is in `docs/`:

| File | What |
|---|---|
| `docs/SETUP_CHECKLIST.md` | What the owner does before the build (short) |
| `docs/KICKOFF_PROMPT.md` | The prompt that starts the build session |
| `docs/BUILD_BRIEF.md` | The complete build plan, executed in one session |
| `docs/PROGRESS.md` | Milestone checklist the build ticks |
| `docs/DECISIONS.md` | Every locked decision and why |
| `docs/GAME_DESIGN.md` | Rules, formulas, controls, systems |
| `docs/CONTENT_ENEMIES.md` | 64 enemies, Elites, 8 bosses, the Instructor, Mimic, Gary |
| `docs/CONTENT_ITEMS.md` | Weapons, skills, shields, tools, armor, rings, affixes, gems, consumables, loot |
| `docs/CONTENT_SPELLS_CLASSES.md` | 28 spells, 10 classes |
| `docs/PROCGEN.md` | Zone and room generation |
| `docs/NETCODE.md` | Online co-op |
| `docs/DATA_MODEL.md` | Save, item and data-table schemas |
| `docs/ART_AUDIO.md` | Vector art, telegraphs, VFX, synthesized audio, UI |

The build fills in the "How to run" and "Controls" sections below.

## How to run

Needs Node 24. Commands are Windows PowerShell 5.1 (chain with `;`).

```powershell
cd C:\dev\DungeonJoe; npm install
npm run dev            # http://localhost:5173/DungeonJoe/
npm run build          # production build to dist/
npm run preview        # serve dist/ at http://localhost:4173/DungeonJoe/
npm run typecheck; npm run lint; npm test
npm run test:e2e       # Playwright (Chromium; first time: npx playwright install chromium)
npm run validate:data
```

## How it deploys

Every push to `main` runs `.github/workflows/deploy.yml`: install, type check, lint, unit tests, build, then
publish `dist/` to GitHub Pages. One-time setting on GitHub: **Settings → Pages → Build and deployment →
Source: GitHub Actions**. `npm run deploy` prints the live URL.

## Controls

(filled in at M7; defaults are in `docs/GAME_DESIGN.md` §4)
