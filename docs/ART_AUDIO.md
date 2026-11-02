# Dungeon Joe — Art, VFX, Audio, UI style

Decisions D8 (code-drawn vector art), D13 (synthesized audio), D14 (grim world, cheeky text).

## 1. Rendering

- One `<canvas>` at a logical **1280 × 720**, scaled to fit the window with letterboxing, drawn with
  `devicePixelRatio` so lines stay crisp. Menus are DOM overlays positioned over the canvas.
- Layers per frame: static floor (pre-rendered to an offscreen canvas per room) → hazard tiles →
  telegraphs → shadows → entities sorted by `y` → projectiles → particles → damage numbers → HUD.
- Glows: never `shadowBlur` per entity per frame. Pre-render glow discs/rings to offscreen canvases and
  blit with `globalAlpha` and `lighter` composite.
- Target 60 fps with 12 enemies, 4 players, 300 particles on a mid laptop. Particle pool, no per-frame
  allocations in hot loops, `requestAnimationFrame` render with a fixed 1/60 s simulation accumulator.

## 2. Style

- Thick dark outlines (3 px), flat fills with a 2-tone shade (base and a darker underside), small
  specular dots. Silhouettes first: every enemy must be recognisable as a black shape.
- Each enemy references a `DrawId` implemented in `src/engine/draw/*.ts` built from shared parts:
  bodies (blob, biped, quadruped, floater, swarm cluster, construct), heads, limbs, weapons, auras.
- Procedural animation: idle bob (sin), lean into movement, squash-and-stretch on attack windup/release,
  white flash on hit (80 ms), **red tint + red pulse rings** during a Red windup, **blue-white glow +
  hollow ring icon** during a Piercing windup, grey desaturation when downed.
- Players: Joe is a round-headed guy with stubble; class gear is drawn on top (helmet shapes, robe,
  cloak, bathrobe for Nobody). Weapons are drawn in hand and swing with the attack arc.
- Zone palettes (hex): Crypt `#2f3d2a #a9b7a0 #e8e1c8 #6b7f66` · Caverns `#3b2a4f #5fd3c0 #8b5a3c
  #c58cff` · Sewers `#2d3b2b #7d5a2e #0e1a14 #8fa37a` · Forest `#c8621f #1f3d22 #e6b84a #5a3a1a` ·
  Forge `#8e1b1b #1a1010 #ff7a1a #ffd27a` · Reliquary `#9ad0ff #f4f8ff #d4af37 #3a5a8a` · Citadel
  `#b08d3c #2aa198 #6c4ab6 #1a1a22` · Abyss `#06030a #7a2bd6 #ffffff #2a0d3f`. Rarity colors:
  white `#e8e8e8`, green `#58d66a`, blue `#4aa3ff`, purple `#b06bff`, orange `#ff9b2e`.

## 3. Telegraphs

Every pattern primitive (GAME_DESIGN §5.7) draws: a 22%-alpha fill, a 2 px outline, and a **progress
fill** that grows from the edge to the center (or along the sweep direction) over the telegraph time, so
the moment of impact is readable. Red attacks use red (`#ff3b3b`) and a skull icon over the attacker;
Piercing uses blue-white (`#8fd3ff`) with diagonal stripes and a hollow-ring icon. High-contrast mode
doubles outline width and icon size.

## 4. VFX

Hit sparks (color by damage type), slash arcs (weapon arc drawn as a fading wedge), dust puffs on
dodge, blood is grey dust for undead and dark for beasts (no gore), status particles (embers, frost
motes, sparks, red drips, green bubbles), screen shake scaled by damage (settings 0–100%), hitstop,
floating damage numbers (type-colored; crits bigger), boss intro card (name, subtitle, 1.5 s), phase
transition flash, level-up ring, Shard pickup trail to the HUD counter, loot beam by rarity color.

## 5. Audio (Web Audio API)

`src/engine/audio/`: a mixer (master / sfx / music gains), a `Sfx` module that builds sounds from
oscillators (sine/square/saw/triangle), filtered noise, and ADSR envelopes, cached as buffers on first
use. Sound list: swing light/medium/heavy, hit flesh/bone/metal/slime, block, guard break, parry
(bright ding), riposte, dodge whoosh, **Red warning** (low two-note horn), **Piercing warning** (high
chime), footsteps per surface, projectile shots, spell casts per school, heal, flask drink, chest open,
mimic bite, reliquary chime, level up, bonfire rest (crackle + warm chord), boss roar, phase change
(sub drop), downed (muffled), revive (rising), death sting, UI hover/click/confirm/back, Shard pickup,
loot drop by rarity.

Music: a procedural ambient system per zone: a drone (two detuned oscillators), a slow pentatonic
arpeggio seeded from the zone, filtered noise wind, tempo and brightness from `ZoneDef.music`. Boss
rooms switch to a faster pulse with a kick-like low sine every beat; phase 2 adds a second voice.
Volume ducks on the death screen. Everything respects the mixer and the browser autoplay rule (start on
first input).

## 6. UI

Dark UI, warm parchment text (`#efe6d2` on `#14121a`), rarity-colored item names, system font stack
(`"Segoe UI", system-ui, sans-serif`) with a monospace for numbers; no external font loads (offline
friendly). Tooltips compare against the equipped item (green/red deltas). Menus are keyboard and
gamepad navigable (focus ring). Text table in `src/ui/strings.ts` (D36). Cheeky strings live there too
(death screen variants, flavor lines, Gary's greetings, sign posts).
