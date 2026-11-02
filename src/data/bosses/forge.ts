// CONTENT_ENEMIES §11 Boss 5 — Foreman Ignatius (Ashen Forge). Not authored yet: null keeps it out of the registry.
import type { RoomTemplate } from '../../game/procgen/templates';
import type { BossDef, EnemyDef } from '../../game/types';

export const FOREMAN_IGNATIUS: BossDef | null = null;
export const FOREMAN_IGNATIUS_ARENA: RoomTemplate | null = null;
/** Boss-only bodies and summons (special: true), merged into ENEMIES. */
export const FOREMAN_IGNATIUS_PARTS: Record<string, EnemyDef> = {};
