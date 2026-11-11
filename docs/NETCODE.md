# Dungeon Joe — Online Co-op Netcode

How four-player co-op works today. Source: `src/game/net/*` (`protocol.ts`, `transport.ts`, `trystero.ts`,
`loopback.ts`, `broadcast.ts`, `host.ts`, `guest.ts`, `snapshot.ts`, `charSync.ts`, `clock.ts`, `lobbyGear.ts`),
the scenes `game/scenes/lobby.ts`, `run.ts` (host) and `guestRun.ts` (guest), and `game/save/coopProgress.ts`.
Design rules are in GAME_DESIGN §12; decision ids point to `docs/DECISIONS.md`.

Contents: [1 Model and transport](#1-model-and-transport) · [2 Session flow](#2-session-flow) ·
[3 Channels](#3-channels) · [4 Snapshots](#4-snapshots) · [5 Guest prediction](#5-guest-prediction-and-interpolation) ·
[6 Authority and character sync](#6-authority-and-character-sync) · [7 Host rules](#7-rules-the-host-applies) ·
[8 Transports for tests](#8-transports-for-tests) · [9 Limits](#9-known-limits)

## 1. Model and transport

- **Host-authoritative** (D4): the host's browser runs the only simulation. Guests send inputs, mirror the host's
  world from snapshots for the normal renderer, and own their own characters. Up to 3 guests (`MAX_GUESTS`).
- **Trystero** over WebRTC data channels (D5). `appId` `dungeon-joe-v1`. Strategies load on demand (solo play never
  downloads them): **Nostr** relays first; the host also listens on **MQTT**; a guest that finds no peer within 8 s
  adds MQTT and then sticks to whichever network a peer turned up on (D158). The room id is the **6-digit room code**
  (D76; typed codes accept spaces, dashes and O for 0) and a password derived from it encrypts the traffic.
- Every channel is reliable and ordered. JSON for most messages; `ArrayBuffer` for inputs and snapshots.
- **Version check:** a guest's `hello` carries the game version; a mismatch is rejected with
  "Host is on X, you are on Y."

## 2. Session flow

```
Host:  Title → character → Host → lobby (room code, player cards drawn in their gear, D170) → Start
Guest: Title → character → Join → code → lobby → waits for Start
```

- **Joining happens only in the lobby** (D31). Once the game has started, a new `hello` is rejected ("The game has
  started. Ask the host to return to the lobby."). A guest already in the party saying hello again is ignored (D156).
  The party is at most 4; the same character twice is rejected.
- **Start:** every guest gets `welcome` (seed, cycle, zone, layout options, host time, player slot), generates the
  same zone layout locally, and appears at the host's respawn bonfire. A fresh 10 s grace starts for everyone (D161).
- **Return to lobby** (host pause menu): bodies leave the world, everyone sees the lobby (`toLobby`), and more players
  can join. The world is saved.
- **Leaving:** a guest that sends `leave`, closes its connection, or is silent for 10 s is removed (and its body).
  If the host leaves, guests get `hostLeft`, keep everything earned and return to the title.

## 3. Channels

| Channel | Direction | When | Payload |
|---|---|---|---|
| `hello` | guest → host | joining | `{ version, playerId, name, classId, level, char }` (the whole character) |
| `lobby` | host → all | lobby changes | `{ code, players: PublicPlayer[], zone, ff? }`: each player's name, class, level, cycle, look and worn gear (`LobbyGear`), the host's friendly-fire percent |
| `welcome` / `reject` | host → guest | on Start / refused | `Welcome { you, seed, cycle, zone, layoutOpts, time, slot }` / `{ reason }` |
| `input` | guest → host | every frame | 17-byte packet: `seq u16, moveX i8, moveY i8, aimX i16, aimY i16, buttons u16, pressed u16, tick u32, flags u8` (aim neutral, aim assist 0–7) |
| `snap` | host → each guest | 30 Hz (`SNAP_HZ`, D149); a keyframe every 2 s or on request | snapshot (§4), built per guest |
| `event` | host → all or one | reliable | `NetEvent`: `bonfire { id, first }`, `zone { zone, seed, cycle, layoutOpts }`, `died`, `wipe`, `toLobby`, `hostLeft`, `chat`, `credits`, `zoneBeaten { zone, cycle }` (D195) |
| `cmd` | guest → host | reliable | `leave`, `fullPlease` (send a keyframe), `chat` |
| `charop` | host → guest | after a tick that changed the guest's character | `{ rev, ops: CharOp[] }` (§6) |
| `char` | guest → host | after the guest changes its own character | `{ ack, char }` (§6) |
| `ping` / `pong` | guest ↔ host | 1 Hz | `{ t }` for the RTT readout |

Everything that happens in the world (hits, deaths, sounds, effects, messages, loot, Shards, level banners, feats)
travels as **world events inside the snapshot** (`json.ev`, the sim's `GameEvent`s: `dmg, death, downed, revived,
parry, guardBreak, bossPhase, loot, shardGain, msg, sfx, fx, shake, telegraph, levelBanner, stat, feat`). The host
filters them per guest: personal messages, `loot` and `shardGain` only to their player; `hitstop` never.

## 4. Snapshots

`encodeSnap` / `decodeSnap` (`snapshot.ts`). Header: `full u8, tick u32, time f64, ackSeq u16` (the guest's last
input the host applied), record count, removed count, JSON length. Then fixed **28-byte records** (the last byte a downed player's countdown, D329), removed ids (u16),
and a JSON block.

| Record field | Encoding |
|---|---|
| `id` u16, `kind` u8 (entity type), `pose` u8 | pose index (`idle, windup, attack, recover, swing, cast, open, parry, stagger, hurt, devour`) |
| `x`, `y` i16 | × 2 (half-pixel steps) |
| `facing` u8 | 256 steps |
| `state` u8 | player or enemy state index |
| `flags` u16 | `flash, red, blue, dead, downed, deadUntilRest, blocking, parry, invuln, transition, charging, used, windRed, windPierce, stagger, faded` (all 16 bits used) |
| `hp` u16 | permille of max |
| `alpha`, `scale`, `squash`, `poseT` | animation |
| `extra`, `extra2` u16 | players: revive progress / need; enemies: boss phase / spawn-tell progress; lobbed shots: flight progress |
| `cIdx`, `cPhase`, `cK` u8 | players' attacks: a combo swing is its index; **an off-hand shot is 100 + index** (D291); a weapon skill is 200 + key (D234). `cPhase` = windup / active / recovery, `cK` = progress |
| `status` u16 | bits 0–4 the statuses, 5–10 the controls |

- **Deltas:** a `snap` carries only records that changed since what that guest last got, plus removed ids. A
  keyframe (`full`) resends everything.
- **Meta** (`json.meta`, sent only when it changes): what an entity is. Players: id, slot, name and their public
  character (gear, look, stats; never the bag). Enemies: def id, elite, piece, boss, draw id, radius (it changes with
  phases), gaze, linked id and the attack under way (`atk`, so guests draw its real windup and element, D149).
  Others: the component itself (telegraph shapes and timing, hazard, pickup contents, interactable, projectile look,
  decoy, wall). **Instanced loot** (a pickup for another player) is never sent to anyone else (D33).
- **Room** (`json.room`, when it changes): tiles, overlay and terrain (base64), doors (exists, open, locked), hazard
  kind, rotating floor, moving floors (D95), and the visited / cleared lists for the minimap.
- **Self** (`json.self`): the guest's own HUD state (HP, stamina, barrier, meters, statuses, controls, cooldowns,
  dodge, guard break, ghost timers) plus the host's position and walking speeds for prediction.
- Also: `bossId` (the boss bar; guests start a boss intro when it turns to a boss still in its spawn tell),
  `roomMods` (darkness, flooding) and `ff` (the host's friendly-fire percent, D115).
- Telegraphs are entities, so their shapes travel in meta and the guest draws them from its own clock; particles are
  never sent. A charge's fitted bar (D272) and a two-set pattern's late `start` (D261) are part of the telegraph.

## 5. Guest prediction and interpolation

- **Own movement is predicted** from local input with the host's own walking code (`walkSpeedFor`). Every
  unacknowledged input keeps the speed and forced step it was predicted with; on each snapshot the guest replays
  them from the host's position. An error under 64 px eases over about 100 ms, a larger one snaps. While the host
  reports that the guest cannot walk (a swing's step, a stagger, a grab), errors under 160 px are held rather than
  snapped, so a knockback does not look like a teleport (D150, D154).
- **Dodges start locally** the moment they are pressed (D149) on the host's dodge path; reconciling waits until the
  host has run the same dodge (dodge length + a round trip + 120 ms).
- **Swings start locally** for movement (D154): the guest runs its own swing on the host's combo rules (queue in the
  recovery, a queued swing at 45% of it, the last waits for the end, a swing within 0.5 s continues the combo), slows
  its walk by the weapon's swing factor and takes the windup's step. Hits, damage and loot come only from the host.
- **Everything else is interpolated** between the two snapshots around a time behind the host's clock. `HostClock`
  keeps a smoothed offset (follows the fastest snapshots, eases at most 2 ms a snapshot), measures jitter, and draws
  1.5 snapshot intervals + 2.5 × jitter behind it, 60–250 ms (D149). Walking animation is measured from each body's
  movement on the mirror (D151).
- The host applies guest inputs on arrival and keeps the last one if a packet is late; `pressed` buttons accumulate
  until the next tick so no tap is lost.

## 6. Authority and character sync

| The host owns | Each guest owns (its own save) |
|---|---|
| the world: rooms, enemies, bosses, projectiles, telegraphs, hazards, loot rolls, Shard drops, revives, bonfires, shop and Gary stock | its character: inventory, equipment, gems, spells, consumables, Glowen, Shards, level and stats, Soul Essence, proficiency, Bestiary, its controller layout |

- The host simulates with a **copy** of each guest's character (it needs stats and gear). What the simulation changes
  on that copy becomes numbered **`CharOp`s** (`charSync.ts`): `add` (Shards, Glowen, tears, bosses beaten), `set`
  (Thermos, highest zone, two-handing, quick slot), `bag`, `gem`, `consumable`, `spell`, `gear` (a weapon swap), `prof`,
  `essence`, `bestiary`, `seen`. They go to the guest on `charop` with a revision number.
- When the guest changes its character itself (equipping, levelling, gems, reinforcing, breaking down Essence,
  locking items or gems, selling), it does so **locally**, at its own bonfire menus, and sends the whole character on
  `char` with the last revision it applied. The host adopts it and replays any newer ops on top, so nothing granted in
  flight is lost. Gems arriving this way are cleaned (`untierGem`, origin checks).
- Each guest writes its own save. Loot is rolled on the host from `loot:<playerId>:…` streams and dropped for that
  player only (D33); Shards per kill go to every player in full.
- **Zone progress** (D195, `coopProgress.ts`): when a boss falls the host sends `zoneBeaten { zone, cycle }`. A guest's
  own world keeps it only if that world had already reached the zone (it can chain); a different NG+ cycle never
  counts. Pending progress is stored in `SaveFile.pending`.
- **Cutscenes** need no messages: each client plays them as a local overlay from the zone change, the boss bar and
  the boss's death event; the host holds the boss and every player's input for the boss intro.

## 7. Rules the host applies

- **Co-op HP** (D159): recomputed on join and leave for every enemy, keeping its HP fraction: bosses and Elites
  ×(1 + 1.25 × (players − 1)), every other enemy ×(1 + 0.75 × (players − 1)); a boss's current bar share is kept
  (`barMult`, D289). Boss poise +150% per extra player (D194). Rooms add one solo-size wave per extra player; Shards
  and drop chances are divided so each player earns the same per room (PROCGEN §4).
- **Downed and revive** (D12): hits on a ghost add the attacker's weapon revive value; while a ghost waits, the host
  refuses door and stairs transitions.
- **Friendly fire** (D115) with the host's percent (0–200), sent in the lobby and every snapshot; guests show it
  read-only.
- **The stun rule** (D293), grabs and every other hit are decided on the host; guests only see the result.

## 8. Transports for tests

- `LoopbackTransport` / `LoopbackHub`: in memory, with configurable latency, jitter and loss; the netcode unit tests
  run a host and up to 3 guests in Node.
- `BroadcastTransport`: `BroadcastChannel` between pages of one browser. `?net=bc&auto=host|guest&code=…` runs one
  side on it; `?net=test` shows a host pane and a guest pane side by side in one tab. The Playwright co-op tests use
  two pages of one browser context (one test adds 60 ± 30 ms of delay).

## 9. Known limits

Friends-only play, no anti-cheat; the host's upload carries everyone; public relays can be slow to connect (the UI
shows "finding your friend…" and lets you retry); everyone must run the same version; no drop-in join mid-run.
