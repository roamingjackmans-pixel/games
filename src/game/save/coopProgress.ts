// What a guest's own world keeps from a zone beaten in someone else's (D195, replacing D31's next-zone-only rule).
// A boss beaten in a zone this world had already reached opens the next zone here, and that can chain: join a friend in
// zone 2 with zone 3 open at home, beat 3 and 4 together, and you go home to zone 5 with every bonfire of 1 to 4 still
// there to warp to. A boss beaten in a zone this world never reached counts for nothing here: join in zone 3 with only
// 1 and 2 open, beat 3 and 4, and you go home to zone 2 as you left it. Different New Game+ cycles never mix.
import type { SaveFile } from '../types';

/** The furthest zone this world has reached: where it is, any bonfire found, any boss beaten, any co-op step pending. */
export function worldFrontier(save: SaveFile): number {
  const ws = save.world;
  let z = ws.zone;
  for (const b of ws.bonfiresDiscovered) {
    const m = /^z([0-9]+)-/.exec(b);
    if (m) z = Math.max(z, Number(m[1]));
  }
  for (const b of ws.bossesBeatenThisCycle) z = Math.max(z, Math.min(8, b + 1));
  const adv = save.pending?.advanceToZone;
  if (adv) z = Math.max(z, Math.min(8, adv));
  return z;
}

/**
 * A guest's party beat the boss of `zone` in a host on New Game+ cycle `hostCycle`. Returns true when this world takes
 * it: the zone counts as beaten here and the next one opens (applied on the next Continue, `applyCoopProgress`).
 */
export function guestZoneBeaten(save: SaveFile, zone: number, hostCycle: number): boolean {
  if (hostCycle !== save.character.cycle) return false;
  const frontier = worldFrontier(save);
  if (zone < 1 || zone > 8 || zone > frontier) return false;
  const p = (save.pending ??= {});
  const beaten = (p.beatenZones ??= []);
  if (!beaten.includes(zone) && !save.world.bossesBeatenThisCycle.includes(zone)) beaten.push(zone);
  // only a zone this world had not reached yet moves it on (one already open, say after warping back, does not)
  const next = zone + 1;
  if (next > frontier) p.advanceToZone = next;
  return true;
}

/** On Continue: mark the zones beaten away as beaten here, with their bonfires found, and open the next zone (9 = past The Landlord). */
export function applyCoopProgress(save: SaveFile): void {
  const ws = save.world;
  const p = save.pending;
  if (!p) return;
  const found = (id: string): void => {
    if (!ws.bonfiresDiscovered.includes(id)) ws.bonfiresDiscovered.push(id);
  };
  for (const z of p.beatenZones ?? []) {
    if (!ws.bossesBeatenThisCycle.includes(z)) ws.bossesBeatenThisCycle.push(z);
    found(`z${z}-start`);
    found(`z${z}-boss`);
  }
  const adv = p.advanceToZone;
  if (adv && adv > ws.zone && adv <= 8) {
    ws.zone = adv;
    ws.roomsCleared = [];
    ws.respawnBonfireId = `z${adv}-start`;
    found(`z${adv}-start`);
    save.character.tutorialDone = true;
  } else if (adv === 9) {
    // The Landlord fell in a friend's world: this world opens at his empty arena (stairs up, NG+ fire)
    ws.zone = 8;
    ws.roomsCleared = [];
    ws.respawnBonfireId = 'z8-boss';
    found('z8-boss');
    if (!ws.bossesBeatenThisCycle.includes(8)) ws.bossesBeatenThisCycle.push(8);
    save.character.tutorialDone = true;
  }
  delete p.advanceToZone;
  delete p.beatenZones;
}
