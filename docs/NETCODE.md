# Dungeon Joe — Online Co-op Netcode

How four-player co-op works today. Source: `src/game/net/*` (`protocol.ts`, `transport.ts`, `trystero.ts`,
`loopback.ts`, `broadcast.ts`, `host.ts`, `guest.ts`, `snapshot.ts`, `body.ts`, `acts.ts`, `charSync.ts`, `clock.ts`, `lobbyGear.ts`,
and for friends `friendCode.ts`, `presence.ts`, `friends.ts`), the scenes `game/scenes/lobby.ts`, `run.ts` (host) and
`guestRun.ts` (guest), `game/save/coopProgress.ts` and `game/save/friends.ts`, and the UI `ui/friends.ts`.
Design rules are in GAME_DESIGN §12; decision ids point to `docs/DECISIONS.md`.

Contents: [1 Model and transport](#1-model-and-transport) · [2 Session flow](#2-session-flow) ·
[3 Channels](#3-channels) · [4 Snapshots](#4-snapshots) · [5 The guest's own body](#5-the-guests-own-body-and-the-mirror) ·
[6 Authority and character sync](#6-authority-and-character-sync) · [7 Host rules](#7-rules-the-host-applies) ·
[8 Transports for tests](#8-transports-for-tests) · [9 Limits](#9-known-limits) · [10 Friends, presence and invites](#10-friends-presence-and-invites)

## 1. Model and transport

- **Distributed authority** (D338; was fully host-authoritative, D4): the host's browser runs the world (rooms,
  enemies and their AI, bosses, projectiles, telegraphs, hazards, loot, revives, bonfires). **Each guest's own browser
  runs that guest's own body** (walking, dodges, blocks, parries, swings and the hits they land) at full speed and
  decides every enemy hit on it; the host shows that body where the guest says. Guests mirror the rest of the host's
  world from snapshots for the normal renderer, and own their own characters. Up to 3 guests (`MAX_GUESTS`).
- Not lockstep or rollback (rejected, D338): Chrome and Firefox need not compute `Math.sin`, `Math.cos` and
  `Math.atan2` identically, so two copies of one simulation would drift apart.
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
Invite: host's lobby → Invite (an online friend, §10) → friend: Join → character → lobby (code filled in) → waits for Start
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
| `input` | guest → host | every frame | 17-byte packet: `seq u16, moveX i8, moveY i8, aimX i16, aimY i16, buttons u16, pressed u16, tick u32, flags u8` (aim neutral, aim assist 0–7). Starts the guest's skills, spells and consumables and drives them (§6), and its interactions |
| `body` | guest → host | every frame | 36-byte body packet (§5, `body.ts`): `seq u16, epoch u16, x i16, y i16` (half pixels), `facing, state, pose, poseT, squash, alpha, scale, moving u8, flags u16` (blocking, parry, i-frames, following, charging, flash), `hp f32, barrier f32, stamina f32, combo index / phase / progress u8, status u16, Thermos u8` |
| `act` | guest → host | each frame something happened | `{ a: NetAct[] }` (`acts.ts`): what the guest's own body did to the shared world: `hit` (an enemy hit, resolved), `gary`, `revive` (a hit on a ghost), `ff` (friendly fire on another player), `took` (how an enemy's hit went), `shot` (a ranged swing fired) |
| `snap` | host → each guest | 30 Hz (`SNAP_HZ`, D149); a keyframe every 2 s or on request | snapshot (§4), built per guest |
| `event` | host → all or one | reliable | `NetEvent`: `bonfire { id, first }`, `zone { zone, seed, cycle, layoutOpts }`, `died`, `wipe`, `toLobby`, `hostLeft`, `chat`, `credits`, `zoneBeaten { zone, cycle }` (D195) |
| `cmd` | guest → host | reliable | `leave`, `fullPlease` (send a keyframe), `chat` |
| `charop` | host → guest | after a tick that changed the guest's character | `{ rev, ops: CharOp[] }` (§6) |
| `char` | guest → host | after the guest changes its own character | `{ ack, char }` (§6) |
| `ping` / `pong` | guest ↔ host | 1 Hz | `{ t }` for the RTT readout |

Everything that happens in the world (hits, deaths, sounds, effects, messages, loot, Shards, level banners, feats)
travels as **world events inside the snapshot** (`json.ev`, the sim's `GameEvent`s: `dmg, death, downed, revived,
parry, guardBreak, bossPhase, loot, shardGain, msg, sfx, fx, shake, telegraph, levelBanner, stat, feat`). The host
filters them per guest: personal messages, `loot` and `shardGain` only to their player; `hitstop` never; a `dmg`,
`sfx` or `fx` marked `echo` with a guest's player id (its own hit, which its screen already showed, D338) never to
that guest.

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
| `extra`, `extra2` u16 | players: revive progress / need; enemies: boss phase / spawn-tell progress (an Arcane Elite past its tell: 2000 + its orbs' angle in 60,000 steps a turn, D340); lobbed shots: flight progress |
| `cIdx`, `cPhase`, `cK` u8 | players' attacks: a combo swing is its index; **an off-hand shot is 100 + index** (D291); a weapon skill is 200 + key (D234). `cPhase` = windup / active / recovery, `cK` = progress |
| `status` u16 | bits 0–4 the statuses, 5–10 the controls |

- **Deltas:** a `snap` carries only records that changed since what that guest last got, plus removed ids. A
  keyframe (`full`) resends everything.
- **Meta** (`json.meta`, sent only when it changes): what an entity is. Players: id, slot, name and their public
  character (gear, look, stats; never the bag). Enemies: def id, elite, piece, boss, draw id, radius (it changes with
  phases), gaze, linked id, its max HP in the host's world (`hm`: co-op scaling, so a guest's bar and its own hits
  measure against the real total, D340) and the attack under way (`atk`, so guests draw its real windup and element, D149).
  Others: the component itself (telegraph shapes and timing, hazard, pickup contents, interactable, projectile look,
  decoy, wall). **Instanced loot** (a pickup for another player) is never sent to anyone else (D33).
- **Room** (`json.room`, when it changes): tiles, overlay and terrain (base64), doors (exists, open, locked), hazard
  kind, rotating floor, moving floors (D95), and the visited / cleared lists for the minimap.
- **Self** (`json.self`, `SelfState`): the host's word on the guest's own body (D338), only what the host decides:
  `epoch` with `x, y, hp` (applied when the epoch changes: a down, a revive, a respawn, a teleport), `downed`, `dead`
  (out until the rest), the ghost countdown, skill and spell cooldowns, `follow` and `state` (the host is running one
  of its skills, spells or consumables), the last input applied, **`delta`** (what the host's world did to the body
  since the last snapshot, §6) and **`hits`** (enemy hits on the body for the guest to decide, §5). The guest's own
  record in the snapshot is ignored except for its revive ring (and its look while it follows the host).
- Also: `bossId` (the boss bar; guests start a boss intro when it turns to a boss still in its spawn tell),
  `roomMods` (darkness, flooding and how hard it slows, the Lightning bonus on magic: D345) and `ff` (the host's friendly-fire percent, D115).
- Telegraphs are entities, so their shapes travel in meta and the guest draws them from its own clock; particles are
  never sent. A charge's fitted bar (D272) and a two-set pattern's late `start` (D261) are part of the telegraph.

## 5. The guest's own body and the mirror

**The guest's own body is its own (D338).** It is a real player entity in the guest's mirror world
(`PlayerC.net = 'body'`), and every frame `stepBody` (`body.ts`) runs it there with the same code the host runs for
its own player: `updatePlayer`, then forced motion, holes and moving floors for that one body
(`updateMovement(w, dt, only)`), then its statuses (`updateStatuses(w, dt, only)`). Nothing is predicted and nothing is
reconciled: walking, dodges and their i-frames, blocks and the parry window, swings and combo chaining, the swing's
step, stamina, hitstop, the Thermos and its heal, status buildup and ticks, falls into pits, staggers and knockbacks
all happen on the guest's screen at once. The body's clock is the mirror's clock (below), so what it does lines up
with what it sees.

- **Its hits on enemies** (`hitEnemy` with the guest's body as attacker, D338) are resolved on the guest's screen
  against its copy of the enemies: front guards, resistances, crits, ripostes, lifesteal, Thunderclap, the number, the
  flash, hitstop and the knockback (a short nudge that fades as the host's own arrives) show at once, and the enemy's
  bar drops at once (the damage stays off the mirrored bar until the host's snapshot shows it). The outcome goes to the
  host as a `hit` act: the damage before the enemy's barrier, its type and crit, poise damage after the attacker's own
  multipliers, status buildups, control, root, knockback and pull, on-kill effects. On a guest's screen enemies never
  die: the host's death event and snapshot do that. Hits on Gary, on an illusion and on a ghost (`revive`) go the same
  way; friendly fire on another player (D115) goes as `ff` with the unscaled hit, and the host passes it on to whoever
  owns that body.
- **Enemy hits on it are decided on its screen.** The host's world finds them as always (telegraph areas, shots,
  lunges, body and contact hits, Elite orbs, hazards, friendly fire), but `hitPlayer` on a guest's puppet does not
  apply them: it hands the hit to that guest (`NetHostLink.divert`) with the attacker's own multipliers already in it
  (its buffs, the late fee, the enrage), where it came from, the shot that made it and, where there is one, **the area
  it landed in** (the shape and its moment, at the feet's dot for areas, D262). The hit travels in `SelfState.hits`
  stamped with the host's time. The guest holds it until its own clock reaches that time (at most 0.6 s), the moment
  its screen shows it land, then checks the area against where its body is (4 px of slack) and runs the normal
  `hitPlayer` on its body: its own i-frames, block, parry, Riposte Stance, guard break, barrier, defense, statuses,
  stagger, knockback and grab. It answers with a `took` act (result, damage, grabbed); the host then reflects a
  parried shot or parries the attacker, ends a shot that struck, heals a Vampiric Elite (D336), runs the attack's
  on-hit effects, holds a grabbing enemy, and shows the damage number to everyone else. A guest that has left the area
  on its screen is missed; the host's copy, being a little behind, can miss a hit the guest would have taken (the lag
  favours the defender).
- **What the host runs:** skills, spells and consumables (§6). A press of one that looks ready holds the body's other
  actions for up to 0.5 s (`NET_AWAIT_S`) or until a snapshot shows the host saw the press; while the host runs it
  (`SelfState.follow`) the body follows the host's position and look and walks nowhere of its own. A ranged weapon
  swing plays on the guest's screen, but the arrow is the host's (`shot`).
- **The body packet** goes to the host every frame (§3): position, facing, state, look, combo, blocking / parry /
  i-frame flags, HP, barrier, stamina, status bits and the Thermos count, with the last host `epoch` the guest applied.
- **Everything else is interpolated** between the two snapshots around a time behind the host's clock. `HostClock`
  keeps a smoothed offset (follows the fastest snapshots, eases at most 2 ms a snapshot), measures jitter, and draws
  1.25 snapshot intervals + 2.5 × jitter behind it, 50–250 ms (D338; was 1.5 intervals and at least 60 ms, D149).
  An enemy that is not winding up, attacking or recovering is drawn up to 50 ms further ahead (`ENEMY_LEAD_S`, eased
  in and out), carrying on along its last step if that is past the newest snapshot (at most 100 ms); an attacking
  enemy is drawn exactly as the host ran it, so its swing lines up with its telegraph. Walking animation is measured
  from each body's movement on the mirror (D151).
- The host applies guest inputs on arrival and keeps the last one if a packet is late; `pressed` buttons accumulate
  until the next tick so no tap is lost.

## 6. Authority and character sync

| The host owns | Each guest owns |
|---|---|
| the world: rooms, enemies and their AI, bosses, projectiles, telegraphs, hazards, enemy HP, deaths, phases, loot rolls, Shard drops, revives, the downed countdown and bleed-out, bonfires, shop and Gary stock; every player's skills, spells and consumables; character ops | its body (D338): position, movement, dodges and i-frames, blocks, parries, swings and the hits they land, stamina, HP, barrier, statuses, the Thermos; whether each enemy hit on it lands. Its character (its own save): inventory, equipment, gems, spells, consumables, Glowen, Shards, level and stats, Soul Essence, proficiency, Bestiary, its controller layout |

- **The puppet** (`PlayerC.net = 'puppet'`): the host's copy of a guest's player. Before each tick the host applies the
  guest's newest body packet (`applyBodyReport`: position eased, a jump of 48 px snaps; state, look, combo, blocking,
  HP, barrier, stamina, status bits), takes the Thermos count without an op back (`CharLog.observe`), and downs it if
  the guest reported 0 HP. `updatePuppet` replaces the player controller for it: only the guest's skill, spell and
  consumable presses start here (from its inputs, when it stands idle), and while one runs the host drives the body
  (its timeline, its walking, its dash, `netHostDriven`), as for any player. Movement, falls and statuses skip a free
  puppet; in body separation it does not move (whoever it bumps does).
- **What the host's world does to a guest's body by itself** (a heal or aura, a buff, a barrier, a status from a puddle,
  a control, a stagger, i-frames from a dash skill, a pull, a knockback, a bonfire rest) is caught each tick by
  comparing the puppet with how it stood after the last packet (`snapBody` / `diffBody`) and sent as `SelfState.delta`;
  the guest applies it to its body (`applyDelta`, the host's times turned into its own). A **down, revive, respawn or
  teleport** (a room change) bumps the guest's **epoch**: the guest takes `x, y, hp` and the down state from the host,
  and the host ignores body packets carrying an older epoch, so nothing in flight undoes it.
- The host simulates with a **copy** of each guest's character (it needs stats and gear). What the simulation changes
  on that copy becomes numbered **`CharOp`s** (`charSync.ts`): `add` (Shards, Glowen, bosses beaten), `set`
  (Thermos, highest zone, two-handing, quick slot), `bag`, `gem`, `consumable`, `spell`, `gear` (a weapon swap), `prof`,
  `essence`, `bestiary`, `seen`. They go to the guest on `charop` with a revision number.
- When the guest changes its character itself (equipping, levelling, gems, reinforcing, breaking down Essence,
  locking items or gems, selling, and since D338 two-handing and weapon swaps on its own screen), it does so
  **locally** and sends the whole character on `char` with the last revision it applied. The host adopts it and
  replays any newer ops on top, so nothing granted in flight is lost. Gems arriving this way are cleaned (`untierGem`,
  origin checks).
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
- **Downed and revive** (D12): hits on a ghost add the attacker's weapon revive value (a guest's own hits arrive as
  `revive` acts, within 420 px); the countdown runs on the host and reaches everyone in the record's 28th byte (D329);
  while a ghost waits, the host refuses door and stairs transitions.
- **Friendly fire** (D115) with the host's percent (0–200), sent in the lobby and every snapshot; guests show it
  read-only. A guest's swing on an ally goes to the host (`ff`), and a hit on a guest's body is decided by that guest.
- **Out of combat** (D329) nobody takes damage: the host checks before it hands a guest a hit, and the guest's own
  screen checks again (its copy of the room's enemies).
- **A guest's reported hits** are applied unless the enemy is dead or gone, cannot be hurt right now (spawning, a phase
  change, faded, invulnerable), or is more than 420 px (`REMOTE_HIT_REACH`) from the guest's body; the host stays the
  judge of enemy HP, deaths, phases, loot and Shards.
- **The stun rule** (D293) and grabs on a guest are decided on its own screen, with the same code.

## 8. Transports for tests

- `LoopbackTransport` / `LoopbackHub`: in memory, with configurable latency, jitter and loss; the netcode unit tests
  run a host and up to 3 guests in Node.
- `BroadcastTransport`: `BroadcastChannel` between pages of one browser. `?net=bc&auto=host|guest&code=…` runs one
  side on it; `?net=test` shows a host pane and a guest pane side by side in one tab. The Playwright co-op tests use
  two pages of one browser context (one test adds 60 ± 30 ms of delay).

## 9. Known limits

Friends-only play, no anti-cheat (a guest's screen decides its own hits and the ones it takes; the host only refuses
the impossible); the host's upload carries everyone; public relays can be slow to connect (the UI
shows "finding your friend…" and lets you retry); everyone must run the same version; no drop-in join mid-run.

Of D338's split: a guest's skills, spells and consumables still start a round trip late (the host runs them), and its
arrows and bolts appear from the host; the host's copy of a guest is a little behind it, so a hit it misses there
never reaches the guest; pushes and pulls the host applies to the copy arrive as nudges a snapshot late, and a hazard's
attack slow does not reach the guest; Martyr's Chain does not split damage a guest takes on its own screen.

## 10. Friends, presence and invites

D339. Source: `net/friendCode.ts` (codes, rooms), `net/presence.ts` (the protocol), `net/friends.ts` (the app's
service), `save/friends.ts` (the list), `ui/friends.ts` (Friends screen, lobby invite list, invite card).

- **Friend code:** each browser has one, made once with `crypto` and kept in `dj.friends` (DATA_MODEL §1.1): 10
  Crockford base32 characters, 9 random and 1 check, shown `XXXXX-XXXXX`. Typing forgives case, spaces, dashes,
  O for 0 and I or L for 1. The check character is a weighted sum mod 32 with odd weights (1, 3, 5, …), so it
  catches **every** single-character typo (D342). Codes already on a stored list are kept by shape alone; a stored own
  code that fails the check (made by v1.3.50) is replaced.
- **One room per friend.** Two friends meet in a Trystero room whose id and password come from
  `SHA-256("dungeon-joe-friends|" + both codes, sorted)` (`friendRoom`): `f` + 24 hex for the id, the other 40 hex
  for the password. Only someone who knows **both** codes can find, join or read that room, so a friendship works once
  **both** players have added each other, and nobody else (not a one-sided adder, not the relays) sees anyone online.
  Being online is being in the room. Same `appId` as co-op; **Nostr relays only** (no MQTT fallback: one room per
  friend, kept small); up to 30 friends (`MAX_FRIENDS`).
- **When presence runs:** at boot if the list has anyone on it, and whenever the Friends screen or a host lobby opens.
  A player with no friends never downloads the relay code for it (as with co-op, the strategy loads on the first room).
  "Appear online to friends" off: no rooms at all (so nobody is seen online either). Presence stays up while the game
  is open, through solo runs and co-op.
- **Channels** (in each friend room, JSON):

| Channel | Direction | When | Payload |
|---|---|---|---|
| `fp` | both | on meeting, and on any change (checked every second) | `{ code, name, st, v }`: the sender's own friend code (so a second tab of your own in the room is not taken for the friend), the online name (Settings → Co-op name), status `menu`, `solo`, `hosting` or `coop`, game version |
| `fi` | host → friend | Invite | `{ id, room, name, zone, ttl }`: the 6-digit room code, the host character's name and zone, 60 s to answer |
| `fa` | friend → host | Join / Decline | `{ id, ok, why? }`: `why: 'busy'` when the friend is in a co-op game (answered without asking) or cannot leave where they are |
| `fx` | host → friend | the lobby closes or Start is pressed | `{ id }`: the invite is withdrawn |

- **Invites:** one waiting invite per friend; the Invite button counts down and says *declined*, *busy* or *no answer*
  afterwards. Not offered to a friend on another version or in a co-op game, or when the party is full. An invite ends
  when answered, after 60 s, when the host withdraws it, or when either side goes offline; the friend's card closes
  with a toast. **Join** does what typing the code would: from the title, a character picker (one character goes
  straight in; none opens the creator, "Create and join"); from a solo run, the run is saved and left; from a lobby
  with nobody else in it, that lobby closes. A host whose lobby has guests, or anyone in a running co-op game, answers
  busy. Joining still happens only in the lobby (D31): a friend who accepts after Start is rejected as usual.
- **Tests:** the loopback transport runs presence and invites in Vitest; Playwright uses `?net=bc` with
  `&me=CODE` (this page's own code, its list kept under `dj.friends.CODE`) and `&friends=A,B` (pre-added), which only
  work on the test transport.
- **Limits:** a friend code posted publicly can be added by anyone, but they still see nothing unless you add theirs;
  someone who knows both codes of a pair could pretend to be either. No friend requests or chat; names are what each
  player announces.
