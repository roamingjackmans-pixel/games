# Dungeon Joe — Owner setup checklist (do this before the build prompt)

Checked on 2026-11-02 from this machine: Node v24.21.0, Git 2.55, GitHub CLI 2.102, `gh` logged in as
`roamingjackmans-pixel`, user Pages site `roamingjackmans-pixel.github.io` serving `https://josephjackman.com/`
with HTTPS, sibling project sites at `https://josephjackman.com/<repo>/`. So only steps 1–3 are left.

Everything below is Windows PowerShell 5.1 (no `&&`).

## 1. Rename the project folder (D30)

Close any editor or terminal that has the folder open, then:

```powershell
Rename-Item -Path "C:\dev\Dungeon Joe" -NewName "DungeonJoe"
```

Open the Claude desktop app's Code tab on `C:\dev\DungeonJoe` afterwards (not the old path).

## 2. Confirm the tools once more (new terminal)

```powershell
node -v; npm -v; git --version; gh --version; gh auth status
```

Expected: Node 24.x, a git version, gh logged in to github.com as `roamingjackmans-pixel`.

## 3. Git identity (only if `git config --global user.name` prints nothing)

```powershell
git config --global user.name "Joseph Jackman"; git config --global user.email "<id>+roamingjackmans-pixel@users.noreply.github.com"
```

(Find the noreply address at GitHub → Settings → Emails.)

## 4. Start the build

1. Open a **new** Claude Code session on `C:\dev\DungeonJoe`, model **Opus**, permission mode that lets
   it run `npm`, `git` and `gh` without prompting on every call (auto mode or a project allowlist).
2. Paste the contents of `docs/KICKOFF_PROMPT.md` as the first message.
3. Walk away. The brief tells Opus to commit and push at every milestone and to continue from
   `docs/PROGRESS.md` if a second session is needed (D26). If a session ends early, start a new one with
   the same kickoff prompt.

## 5. One thing only you can do (after M0 creates the repo)

On GitHub: **DungeonJoe repo → Settings → Pages → Build and deployment → Source: GitHub Actions**.
Until this is set, the deploy workflow cannot publish. You can do it as soon as the repo appears (the
build keeps going without it) or at the end.

## 6. After the build

- Play through `docs/OWNER_CHECKS.md`.
- The debug menu is Ctrl+Shift+D in the game; the code is in `docs/OWNER_PRIVATE.md` (git-ignored, never
  committed).
- To host a co-op game: Title → Load character → Host → share the 6-letter code. Friends: Join → code.
