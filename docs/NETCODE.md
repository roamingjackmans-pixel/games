# Dungeon Joe — Online Co-op Netcode

Source for `src/game/net/*`. Decisions D4, D5, D12, D15, D31, D33. Design rules in GAME_DESIGN §12.

## 1. Model

- **Host-authoritative.** The host's browser runs the only real simulation. Guests send inputs and
  render the host's state. Up to 3 guests.
- Transport: **Trystero** over WebRTC data channels. Strategy: `trystero/nostr` first; if no peer is
  found within 8 s, retry with `trystero/mqtt`. (Verify the current recommended strategy and API in
  the Trystero README at build time; the torrent strategy has been unreliable.) `appId`:
  `"dungeon-joe-v1"`. Room id = the 6-digit room code (D76; was 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
  Optional `password` derived from the code to keep strangers who guess the id from decrypting traffic.
- Game version string (from `package.json`) is exchanged on hello; a mismatch rejects the join with a
  readable message ("Host is on 1.2.0, you are on 1.1.0").

## 2. Session flow

```
Host: Title → Load character → Host → lobby shows code, player cards → Start
Guest: Title → Load character → Join → enter code → lobby (sees host and others) → waits for Start
```

- Joining happens only in the lobby (D31). The host can "Return to lobby" from the pause menu to invite
  more players; the world is saved and the party re-enters at the host's current bonfire.
- On Start the host sends `welcome` with the full world state; guests load it, show the zone card, and
  spawn at the host's respawn bonfire.
- Host leaves or disconnects → session ends: guests see "Host left", keep everything earned, return to
  the title. Guest leaves → removed after 10 s without packets; its ghost (if downed) disappears.

## 3. Messages (Trystero `makeAction`)

Reliable (ordered) actions carry JSON; the high-rate ones carry `ArrayBuffer`s.

| Action | Dir | Rate | Payload |
|---|---|---|---|
| `hello` | guest → host | once | `{ version, playerId, name, classId, level, stats, equipment (full items), spellLoadout, knownSpells, flaskMax, flaskCur, highestZoneBeaten }` |
| `welcome` / `reject` | host → guest | once | world seed, cycle, zone, room id, room state (cleared rooms, chests, mimics, bonfires used per player), all players' public state, the current `full` snapshot; or `{ reason }` |
| `input` | guest → host | 60 Hz, unreliable | `ArrayBuffer`: `seq u16, moveX i8, moveY i8, aimX i16, aimY i16, buttons u16 (bit per action), tick u32` |
| `snap` | host → all | 30 Hz (D149; was 20) | `ArrayBuffer` delta snapshot (see §4) |
| `full` | host → all | every 2 s and on request | `ArrayBuffer` keyframe snapshot |
| `event` | host → all or one | reliable | JSON: `telegraph` (§4), `hit`, `death`, `downed`, `reviveProgress`, `revived`, `loot` (to one player), `shards` (to one), `chestOpened`, `roomCleared`, `waveSpawn`, `bossPhase`, `zoneChange`, `bonfireRest`, `levelUp` (echo), `progress` (zone beaten credit), `chat`, `gary`, `wipe` |
| `cmd` | guest → host | reliable | JSON: `equip`, `unequip`, `spellLoadout`, `useConsumable`, `interact { targetId }`, `rest`, `levelUp { stat }`, `shopBuy`, `shopSell`, `gem { op }`, `warp`, `chat` |
| `ping` / `pong` | both | 1 Hz | `{ t }` for RTT display |

## 4. Snapshot format

Each entity relevant to rendering is serialised as a fixed record:

```
id u16, type u16, x u16 (×2 fixed), y u16, vx i8, vy i8, facing u8 (256 steps), anim u8, animT u8,
hp u16 (permille), flags u16 (hit flash, red tint, blue glow, elite, invuln, downed, two-handed…),
statusMask u16 (5 statuses + 6 control effects), extra u16 (telegraph progress / boss phase / revive progress)
```

`snap` sends only entities whose record changed since the last acknowledged `full`, plus a list of removed
ids. Telegraph shapes are sent as events (`telegraph { id, ownerId, primitive, params, startTick, endTick }`)
so guests draw them locally from the shared clock. Projectiles are entities. Particles are never sent.

## 5. Guest prediction and interpolation

- Guests **predict their own movement** (position/velocity from local input using the shared movement
  code) and reconcile against the host's authoritative position every snapshot: if the error is < 24 px
  smooth over 100 ms, otherwise snap. **Dodges start locally** the moment they are pressed (D149): the guest runs
  the host's dodge path on its own screen and holds off reconciling until the host has run its dodge and reported
  back (dodge length + one round trip + 120 ms); walking resumes at once. **Swings are predicted for movement too** (D154): the guest starts its own swing the moment attack is pressed, on the host's combo rules (presses queue in the recovery, a queued swing starts at 45% of it, the last waits for the end, a swing within 0.5 s continues the combo), slows its walking by the weapon's swing factor and takes the windup's step toward its aim. Every unacknowledged input keeps the speed and forced step it was predicted with, so a reconcile replays what really happened; errors under 64 px ease over ~0.1 s, knockbacks and staggers glide to the host's newest position, and only a real teleport (160 px or more while stopped) snaps. Hit results come only from the host.
- Everything else renders a little behind the newest snapshot, interpolated between the two surrounding
  snapshots; extrapolate at most 100 ms more on packet loss. **How far behind adapts to the connection** (D149):
  the guest keeps a smoothed estimate of the host's clock (`net/clock.ts`: it follows the fastest-arriving
  snapshots, eases at most 2 ms per snapshot, and measures the jitter) and draws 1.5 snapshot intervals plus 2.5×
  the jitter behind it, 60–250 ms. It used to reset its clock to every snapshot's arrival, which made everything
  judder with the network's jitter.
- Enemy attacks are mirrored with their real definition (the host sends the attack id with the enemy's meta), so
  guests draw the same windup glow, motes and Red / Blue icons as the host (D149).
- The host applies guest inputs on arrival (no artificial delay); it keeps the last input if one is late.
  Guests mark inputs with `tick` so the host can place dodges/parries precisely; parry windows use the
  guest's reported tick when it arrived within 120 ms.

## 6. Authority split

| Owned by host | Owned by each guest (their save) |
|---|---|
| World, rooms, enemies, bosses, projectiles, telegraphs, loot rolls, Shards drops, revive progress, bonfire state, Gary stock | Inventory, equipment, spell loadout, consumables, Glowen, known spells, level and stats, flask count |

Guests send `cmd` for anything that touches the shared world (interact, rest, shop). The host validates
(requirements, range, cooldowns) and replies with events. Equipment changes are validated for
requirements by the host (it has the guest's stats) and applied to the host's copy of the player.
Each guest writes its own save from host confirmations (`loot`, `shards`, `levelUp` echo, `progress`,
`bonfireRest`), so a guest never loses a drop the host already granted.

Loot instancing (D33): the host rolls with stream `loot:<playerId>:<n>` and sends the `loot` event only to
that player; other players never see it. Shards: each player gets the full per-kill amount.

## 7. Scaling and rules on the host

- Co-op HP (D159), recomputed on join/leave for every enemy (each keeps its HP fraction): bosses and Elites
  `1 + 1.25 × (players − 1)`, every other enemy `1 + 0.75 × (players − 1)`. Rooms also get **one extra full wave per
  extra player** (solo-size waves; a 2-wave room has 5 waves with 4 players); an ambush springs its solo waves at once
  and the party's extra waves follow. Shards and drop chances are divided so each player earns the same per room.
- Downed/revive (D12) is simulated on the host: hits on a ghost add the attacker's weapon revive value;
  `reviveProgress` events drive the ring UI.
- Friendly fire (D115) is simulated on the host with the **host's** percent (`World.friendlyFire`, from its
  Settings → Game). The value reaches guests as the optional `ff` field (0–200) of the `lobby` message and of
  every snapshot's JSON, so a change mid-run applies at once; guests show it read-only and never simulate
  hits. Both fields are optional: a missing value leaves the guest's last one (100 by default). Who downed whom
  travels as `feat` world events (`downAlly`, `abandonAlly`) for each player's achievements. While a ghost
  waits for its revive, the host refuses door and stairs transitions ("Revive *name* first!" to that player).
- Zone-progress credit (D31): on boss death the host emits `progress { zone }` to each guest; the guest
  applies the `highestZoneBeaten + 1` rule itself and stores a pending "advance to zone z+1" in its save.
- Cutscenes (GAME_DESIGN §19) need no message: the sim never pauses for them. Each client plays them as a
  local overlay. A guest starts the zone cutscene when its zone layout changes (outside the Training Hall),
  the boss intro when the snapshot's `bossId` turns to a boss still in its spawn tell, and the defeat lines on
  the boss's `death` world event. The host holds the boss and every player's input (`inputLock`) for the
  whole intro (`GameSession.holdBossIntro`). Seen cutscenes go in each player's own `world.cutscenesSeen`.

## 8. Local transport and tests

- `LoopbackTransport` implements the same interface as the Trystero adapter with configurable latency,
  jitter and loss, so the whole netcode is unit-tested in Node (host + 3 fake guests).
- A `?net=test` URL flag opens a two-pane page running a host and a guest in one tab for manual checks.
- Playwright test: two browser contexts, host creates a room, guest joins, both see each other move.

## 9. Known limits (documented in the README)

Friends-only play; no anti-cheat; a host with a bad upload link limits everyone (snapshots are ~2–6 KB at
20 Hz with 12 enemies); public relays can be slow to connect (show a spinner with "finding your friend…"
and a retry button). Mobile browsers are unsupported (D28).
