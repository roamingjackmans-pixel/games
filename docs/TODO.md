# Dungeon Joe — TODO (deferred within the build)

Items deferred during a session, with the reason. Every item is picked up before the build is called done
(BUILD_BRIEF §0). Empty means nothing is deferred.

## Engine gaps reported by the zone content pass (fix before M8 integration)

- [ ] `triggers()` in enemies/ai.ts: hpBelow/firstSight triggers with cooldownS ≥ ~100 never fire (the -100 default fails the cooldown check). Ghoul Leaper's Mist Step is dead.
- [ ] Passive pull (Maw) is switched off while an attack with `pullSpeed` is active; it should keep pulling and pause only in the last 0.2 s of the telegraph.
- [ ] `placePockets` can place a safe pocket over a pit / void tile (Abyss rooms).
- [ ] Traits not implemented: `revealedByHoly` (Holy hits set revealedUntil), `fadeAfterAttackS` (invulnerable after each attack), `weaponPick` (Hollow Joe rolls a weapon: set the draw variant and swap the combo).
- [ ] Swarm move style is not flying: Void Motes walk around pits (acceptable; note in DECISIONS if kept).
