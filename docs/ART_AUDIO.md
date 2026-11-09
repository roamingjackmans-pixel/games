# Dungeon Joe — Art, VFX, Audio, UI

How the game looks and sounds today. Everything is drawn or synthesized in code: no image, font, audio or CDN files
(D8, D13). Tone: a grim world with cheeky text (D14). Source: `src/render/*` (world drawing), `src/engine/draw/*`
(vector art), `src/engine/audio/*`, `src/engine/particles.ts`, `src/ui/*` (DOM menus, HUD, `theme.css`). Decision ids
point to `docs/DECISIONS.md`.

Contents: [1 Rendering](#1-rendering) · [2 Style](#2-style) · [3 Telegraphs and readability](#3-telegraphs-and-readability) ·
[4 VFX](#4-vfx) · [5 Audio](#5-audio) · [6 UI](#6-ui)

## 1. Rendering

- One `<canvas>` at a logical **1280 × 720** (`engine/canvas.ts`), letterboxed to the window, drawn at
  `devicePixelRatio` × the resolution scale, capped at **1.5× pixel density** unless Settings → Video → full
  sharpness is on (D153). Menus, HUD panels, tooltips and touch controls are DOM overlays over the canvas.
- Fixed 1/60 s simulation with render interpolation (`engine/loop.ts`); an optional frame cap (30 / 60 / 120).
- **Room art** (`render/room.ts`) is two cached layers: the **base** (zone floor, hazard floors, pits and void, grates,
  walls drawn by mass with their decorations, pillars, props, trees, unlit door torches, the baked light map), rebuilt
  only when the tiles or door set change and seeded by the room id so a room looks the same on every visit; and the
  **per-version** layer (fallen / crumbling platform tiles, shut doors). Per-frame atmosphere is in
  `render/ambience.ts`.
- **Frame order** (`render/view.ts`): room floor → moving floors → hazards → arena darkness → telegraphs and their
  impact echoes → ground parts of skill / spell animations → room obstacles again (pillars and props sit above attack
  markers, D129) → spell walls → bodies sorted by `y` (players, enemies, pickups, interactables, decoys), bosses always first, underneath (D315) →
  projectiles → status particles → skill / spell animations over the bodies → **Thermos sparkles** (D271) → **each
  player's foot dot** (D262) → zone ambience (particles, vignette) → darkness (Blind, dark phases) → phase flash →
  banners and messages. The HUD is drawn after the world, in the same room coordinates, so the local player's status
  buildup bars (over the head, `ui/hud.ts drawStatusBars`) and the skill circles at the bottom middle sit over every body.
- Performance rules: no `shadowBlur` per entity per frame (glow sprites are pre-rendered and blitted); enemies are
  cached as sprites (`spriteCache.ts`, D152); many-area telegraphs paint their footprint once (D162); the particle pool
  never allocates per frame.

## 2. Style

- Thick dark outlines, flat fills with a darker underside, small specular dots, silhouettes first
  (`engine/draw/parts.ts`). Enemies and bosses are vector drawings registered by `DrawId` (`engine/draw/registry.ts`,
  `enemies/*.ts`, `bosses/*.ts`, shape kits `shapesA/B/Boss.ts`).
- Procedural animation: idle bob, lean, squash and stretch on windups, a white flash on hit, a **red tint** during a Red
  windup and a **blue-white glow** during a Piercing windup, grey when downed. An enemy of an element glows its damage
  type, and its attacks show a charge-up aura and strike streak in the attack's type colour (`elementFx.ts`, D81).
  Immune (faded) enemies get a gold border (D108), except during a scripted boss transformation (D279).
- **Joe** (`engine/draw/players.ts`): a person in a top-down 3/4 view with a face, hair, arms holding the weapon grip
  and the off-hand item, and a walk cycle. The character creator sets body type, skin, hair and style, beard, eye
  colour and shape, nose, brows, face mark and arm / leg features (D183). Armour sets draw head and body gear with
  extras from `data/armorLooks.ts`. Weapons, shields and casting tools are drawn in hand (`engine/draw/weapons.ts`);
  every legendary name has its own design (`legendaryWeapons.ts`). An off-hand crossbow is held at the side and
  raised when it fires (D291). Weapon skills move the weapon by their own data (`skillPose.ts`, D234).
- **Zones** (`data/zones.ts` palettes, `render/roomStyle.ts`, `floors.ts`, `walls.ts`, `holes.ts`): Mossy Crypt,
  Fungal Caverns, Drowned Sewers, Hollow Forest, Ashen Forge, Frozen Reliquary, Clockwork Citadel, The Abyss, each with
  its own floor, wall family, light, props and ambient particles. Hazardous terrain patches are themed per zone
  (`render/terrain.ts`).
- **Doors** carry a torch on the wall tile either side (D263): cold and charred while the door is shut, lit with a
  flickering flame and warm glow when it is open.
- **Rarity colours:** common `#e8e8e8`, uncommon `#58d66a`, rare `#4aa3ff`, epic `#b06bff`, legendary `#ff9b2e`.
- **The Landlord, Unbound** (D279, `engine/draw/bosses/abyss.ts`): during the 4.5 s transformation his face shatters,
  he lies stunned, rises in his suit, a golden-violet aura flares with crackling arcs and the top hat tumbles off as
  black spiked plate forms; the Unbound form is player-sized with a horned helm, red eyes and a void blade, and his
  blinks show a flash where he stands and a violet mark where he lands.

## 3. Telegraphs and readability

`render/telegraphs.ts`, `render/telegraphFx.ts`. A telegraph looks like an attack charging, not a floor marker:

- The **exact hit area** is always drawn: a faint tint and a dim ground texture over the precise footprint and a
  glowing edge that stays within about 2 px of the true boundary. The shapes are the same `Shape`s the hit test uses
  (`combat/patterns.ts`), so what you see is what hits. A charge's or lunge's red bar is its whole hit area (D272).
- Inside it the **charge builds**: the texture lights up from the centre (from the apex for cones, the centre line for
  lines, the outer edge for rings) and meets the edge at the moment of impact; sparks stream inward; the glow throbs
  faster toward impact. Impacts (flash, shockwave, debris) are echoes that outlive the telegraph.
- **Kind colours are the combat language:** Red `#ff3b3b` (unblockable: jagged embers, heat shimmer, a skull icon),
  Piercing `#8fd3ff` (undodgeable: frost shards and **diagonal stripes**, a hollow-ring icon, so it reads without
  colour), normal attacks warm sand (dust, cracks), player skills gold (runes). The damage type only adds an accent.
- **Two-set patterns** (alternating lanes, two-set grids) show each set only when its own charge starts: A shows, B
  shows, A hits, B hits (D261). Sweeping beams sample the arc they turn each frame (D273).
- **High contrast** (Settings → Video) adds a dark outline and a solid kind-coloured edge and strengthens fills; the
  icon size setting doubles the icons.

### 3.1 Readability aids

- **Foot dot** (D262): a small dot in the player's eye colour at their feet (`PLAYER_DOT_R` 5, `PLAYER_DOT_DY` 9 below
  the body centre), drawn over every marker. Area attacks and charge bars test exactly that dot: **if the dot is
  outside the marker, you are safe.**
- The local player's dodge recharge ring; the boss bar (with per-phase names and a second bar for the Landlord's fourth
  phase); damage numbers (Settings → Video); attack icons over attackers; the Red / Piercing warning sounds.

## 4. VFX

- Hit sparks by damage type, slash arcs as fading wedges in the weapon's damage colour (a spin leaves a ring round the
  player, an overhead a burst ring where it lands, a whip's crack an arc at its full length; D320), thrown Chakram rings
  whirling flat as they fly, block and parry flashes, dodge
  dust, status particles (embers, frost motes, sparks, red drips, green bubbles), screen shake scaled by Settings,
  hitstop, floating damage numbers, the boss intro card, the phase-transition flash, level-up ring, Shard motes that
  fly to the HUD counter, loot beams by rarity. Deaths burst into grey smoke and dust; no gore.
- **Skill and spell animations** (`render/skillFx.ts`): a pattern names its look (`PatternCommon.vfx`) and the animation
  plays over the true area (a guillotine slice, a travelling shockwave, a frost lance's spike that fades where it stops
  with no burst (D268), meteors, chains, walls…). Gravity Well has no end burst (D270).
- **Thermos sparkle** (D271, `render/thermosFx.ts`): while a player drinks (1.2 s), a warm gold glow and 14 rising,
  twinkling four-point sparkles; drawn from the drink state, so every co-op client sees it.
- Ambience (`render/ambience.ts`): flickering light pools, torch and candle flames, animated hazard tiles (ripples,
  lava bubbles, ice glints, void motes), turning wall gears, haze in pits, the zone's particles and a vignette.
- Particles are client-only and may use `Math.random()` (cosmetic, never sent over the network).

## 5. Audio

Web Audio, synthesized (`engine/audio/`):

- **`mixer.ts`:** master / sfx / music gains, unlocked on the first input (autoplay rule).
- **`synth.ts`:** offline rendering of oscillators (sine, square, saw, triangle), filtered noise and ADSR envelopes to
  buffers (pure, unit-tested).
- **`sfx.ts`:** sound definitions rendered on first use and cached: swings (light / medium / heavy), hits (flesh,
  bone, metal, slime), block, guard break, parry, riposte, dodge, the **Red warning** and **Piercing warning**,
  footsteps (stone, water, grass), arrow / bolt / magic / enemy shots, Brain and Prayer casts, explosion, heal, flask,
  chest open, mimic bite, reliquary, level up, bonfire, boss roar, the Landlord's `unboundCharge`, `unboundRoar` and
  `voidBlink` (D279), phase change, downed, revive, death, UI hover / click / confirm / back / error, Shard pickup,
  loot by rarity, doors, spawn tell, stagger, the five statuses, splash, fall, Gary, wipe, join, achievement.
- **`music.ts`:** procedural per-zone ambience (a detuned drone, a slow pentatonic arpeggio, filtered wind) from
  `ZoneDef.music`; boss rooms switch to a faster pulse with a low kick on every beat, and later phases add a voice.

## 6. UI

- Dark theme (`ui/theme.css`): parchment text `#efe6d2` on `#14121a`, rarity-coloured names, system fonts (`'Segoe
  UI', system-ui, sans-serif`; numbers in `Consolas, 'Cascadia Mono', ui-monospace, monospace`). No font loads.
- Menus are DOM, fully usable by keyboard, mouse, gamepad (`ui/menuPad.ts`: focus moves, LB / RB tabs, A / B confirm
  and back per the controller layout, X the alternate action, Y the lock button, D265, D282) and touch
  (`ui/touchControls.ts`, D143). Button prompts follow the last device used or a chosen style (`ui/glyphs.ts`).
- **Item cards** (`ui/tooltip.ts`): weapon damage is what the item would really deal equipped, compared like for like
  with what you hold (D294); weapon cards list only the skills the item has unlocked (D267). Padlocks
  (`ui/itemLock.ts`) are inline SVG.
- Text lives with its content: `src/data/story.ts` (cutscenes, bonfire and ember rest lines), flavor fields on every
  data entry, and the menu modules themselves (there is no separate strings table).
