# Kickoff prompt for the build session (paste as the first message to Opus)

```
Build Dungeon Joe. You are in C:\dev\DungeonJoe. Read CLAUDE.md first, then docs/BUILD_BRIEF.md and the
documents it lists, in that order. Then execute docs/BUILD_BRIEF.md from M0 through M16 in this session,
ticking docs/PROGRESS.md with commit hashes as you go. The brief is complete and all decisions are made
(docs/DECISIONS.md); do not ask me questions, pick the closest workable option and record it. Commit and
push at every milestone (the brief says how to create the GitHub repo). Playtest each milestone in the
browser pane with the hidden debug menu before marking it done, keep typecheck, lint and tests green,
and use subagents for parallel content work where the brief suggests it. If this session cannot finish,
leave docs/PROGRESS.md in a state the next session can continue from. When M16 is done, give me the
final message described in BUILD_BRIEF §8.
```

If a second session is needed, paste exactly the same text; BUILD_BRIEF §7 tells the session to continue
from `docs/PROGRESS.md`.
