// CONTENT_ENEMIES §11 Boss 7 — Archmagister Tock (Clockwork Citadel). Not authored yet: null keeps it out of the registry.
import type { RoomTemplate } from '../../game/procgen/templates';
import type { BossDef, EnemyDef } from '../../game/types';

export const ARCHMAGISTER_TOCK: BossDef | null = null;
export const ARCHMAGISTER_TOCK_ARENA: RoomTemplate | null = null;
/** Boss-only bodies and summons (special: true), merged into ENEMIES. */
export const ARCHMAGISTER_TOCK_PARTS: Record<string, EnemyDef> = {};
