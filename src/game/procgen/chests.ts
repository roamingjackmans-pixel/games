// Chests and mimics (PROCGEN §5, GAME_DESIGN §11). Rolls come from the room's stream so host and guests agree.
// A combat room's chest is decided with the zone (D93): it is either standing there when you walk in or the room
// has none. Clearing a room never makes one appear.
import { stream } from '../../engine/rng';
import type { ZoneLayout, RoomNode } from './zone';

export const MIMIC_RATE = 0.05;
/** share of combat and ambush rooms that hold a small chest (the dead ends left over after special rooms always do) */
export const SMALL_CHEST_RATE = 0.25;

export interface ChestPlan {
  id: string;
  kind: 'small' | 'treasure';
  mimic: boolean;
  /** the treasure room chest is sometimes guarded */
  guarded: boolean;
}

/** The chest a treasure room always has. */
export function treasureChest(layout: ZoneLayout, node: RoomNode, noMimics: boolean): ChestPlan {
  const rng = stream(layout.seed, `chest:${layout.zone}:${layout.cycle}:${node.id}`);
  const mimic = !noMimics && rng.chance(MIMIC_RATE);
  return { id: `${node.id}-c0`, kind: 'treasure', mimic, guarded: rng.chance(0.3) };
}

/**
 * The small chest a combat or ambush room holds from the moment you enter it, or null. A pure function of the
 * zone seed and the room: the room has its chest every time you walk in (until it is opened) or never.
 */
export function smallChest(layout: ZoneLayout, node: RoomNode, noMimics: boolean): ChestPlan | null {
  if (node.kind !== 'combat' && node.kind !== 'ambush') return null;
  const rng = stream(layout.seed, `chest:${layout.zone}:${layout.cycle}:${node.id}`);
  const roll = rng.chance(SMALL_CHEST_RATE);
  if (!roll && !node.bonusChest) return null;
  const mimic = !noMimics && rng.chance(MIMIC_RATE);
  return { id: `${node.id}-c0`, kind: 'small', mimic, guarded: false };
}

/** Raw mimic roll for the 5% ± 0.5% test. */
export function rollMimic(seed: string, i: number): boolean {
  return stream(seed, `chest:test:${i}`).chance(MIMIC_RATE);
}
