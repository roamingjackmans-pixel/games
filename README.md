# Dungeon Joe

A browser souls-like with the pace of Hades, the rooms of The Binding of Isaac and the loot of Diablo 3.
Six stats (HP, Stamina, Bonk, Slicey, Brain, Prayer), weapons with three cooldown skills, spells on staffs
and talismans, bonfires and a Thermos, Red attacks you cannot block and Piercing attacks you cannot dodge,
mimics, gems, ten classes, ten save files, eight zones with eight bosses, New Game+, and four-player
online co-op. Everything is drawn and synthesized in code: no images, fonts or audio files.

Plays at **https://josephjackman.com/games/dungeonjoe/** (GitHub Pages, from the `games` repository).

## How to run it locally

Needs Node 24. Windows PowerShell 5.1:

```powershell
cd C:\dev\DungeonJoe; npm install
npm run dev            # then open http://localhost:5173/games/dungeonjoe/
```

Other commands:

```powershell
npm run build                                  # production build to dist/
npm run preview                                # serve dist/ at http://localhost:4173/games/dungeonjoe/
npm run typecheck; npm run lint; npm test      # the checks CI runs
npm run test:e2e                               # Playwright (first time: npx playwright install chromium)
npm run validate:data                          # every content table, plus the "nothing refills the Thermos" rule
npm run balance                                # bot campaigns through all 8 zones (docs/BALANCE_REPORT.md)
```

## How it deploys

Every push to `main` runs `.github/workflows/deploy.yml`: install, type check, lint, unit tests, build,
then publish to GitHub Pages under `/games/dungeonjoe/` (with a small `/games/` hub page). One-time setting
on GitHub, in the `games` repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Playing together (online co-op, up to 4)

1. The host presses **Host a game** on the title screen (and picks a character if they have several, or makes
   one). The lobby shows a 6-digit room code.
2. Friends press **Join a game**, pick their own character and type the code. Public relays can take a few
   seconds ("finding your friend…"); **Retry** if it stalls.
3. The host presses **Start**. Everyone appears at the host's bonfire in the host's world.

(Host and Join are also on each character card under **Characters**.)

Guests keep everything they earn (Shards, loot, levels, spells, gems, flask upgrades). A boss beaten together
also counts in a guest's own world when it is that guest's next zone. Fallen players become ghosts:
hit them to revive them. The host can **Return to lobby** from the pause menu to let more people join.

To try co-op alone on one PC: open `http://localhost:5173/games/dungeonjoe/?net=test` (a host and a guest side by
side, talking through the browser instead of the internet).

## Controls (defaults; all rebindable in Settings)

| Action | Keyboard / mouse | Gamepad |
|---|---|---|
| Move / aim | WASD / mouse | left stick / right stick |
| Attack (hold to charge heavy weapons) | left click | RT |
| Block / parry (tap at the hit) | right click | LT |
| Dodge | Space | A |
| Weapon skills | Q, E, R | LB, RB, Y |
| Spells | 1, 2, 3 | D-pad left, up, right |
| Drink from the Thermos | C | X |
| Quick-use item / cycle it | G / mouse wheel or T | D-pad down / hold D-pad down |
| Interact (rest, open, talk; hold for chests) | F | B |
| Two-hand toggle / swap weapon | Shift / X | R3 / L3 |
| Inventory, map, pause | Tab or I, M, Esc or P | View, hold View, Start |

## The hidden debug menu

**Ctrl+Shift+D** opens it after you type the owner's debug code (only its SHA-256 is in the code). It has
god mode, items, gems, spells, levels, zone and room jumps, boss jumps, enemy spawns, overlays (hitboxes,
telegraph timing, AI state, a frame graph) and NG+ cycles.

## Known limits

- Co-op is for friends: the host runs the world and there is no anti-cheat; a host on a weak upload link
  slows everyone down; public signalling relays are sometimes slow or blocked by networks.
- In co-op only the host buys the bonfire's rotating piece, trades with Gary and travels between bonfires.
- Saves live in the browser's local storage on one machine; use **Export** on the character card to move one.
- Desktop browsers only (keyboard and mouse or a gamepad); phones and tablets are not supported.
- Balance was checked with scripted bots that play worse than a person (docs/BALANCE_REPORT.md); the late
  zones hit hard relative to your HP, which is the first thing to feel out.

## Where things are

| Path | What |
|---|---|
| `docs/OWNER_CHECKS.md` | 25 things to try when you first play it |
| `docs/BUILD_BRIEF.md`, `docs/PROGRESS.md` | The build plan and its ticked checklist (with commit hashes) |
| `docs/DECISIONS.md` | Every decision, including the ones made during the build (D41–D71) |
| `docs/GAME_DESIGN.md`, `docs/CONTENT_*.md`, `docs/PROCGEN.md` | Rules, formulas and every enemy, item, spell and class |
| `docs/NETCODE.md`, `docs/DATA_MODEL.md`, `docs/ART_AUDIO.md` | Co-op, data formats, art and sound |
| `docs/BALANCE_REPORT.md` | What the bot harness found |
| `src/game` | The simulation (no DOM): world, combat, enemies, bosses, procgen, items, saves, co-op |
| `src/data` | Content as data: enemies, bosses, weapons, skills, spells, classes, rooms, loot tables |
| `src/engine`, `src/render`, `src/ui` | Loop, input, audio synthesis and drawing; the world renderer; menus and HUD |
| `tests/unit`, `tests/e2e`, `tests/sim` | Vitest, Playwright, and the balance and leak harness |
