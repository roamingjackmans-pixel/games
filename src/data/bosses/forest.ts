// CONTENT_ENEMIES §11 Boss 4 — Vexthorn, the Hollow Stag (Hollow Forest). Not authored yet: null keeps it out of the registry.
import type { RoomTemplate } from '../../game/procgen/templates';
import type { BossDef, EnemyDef } from '../../game/types';

export const VEXTHORN: BossDef | null = null;
export const VEXTHORN_ARENA: RoomTemplate | null = null;
/** Boss-only bodies and summons (special: true), merged into ENEMIES. */
export const VEXTHORN_PARTS: Record<string, EnemyDef> = {};
