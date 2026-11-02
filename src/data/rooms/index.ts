// Interior templates per zone (10 each).
import type { RoomTemplate } from '../../game/procgen/templates';
import { ROOMS_CRYPT } from './crypt';
import { ROOMS_CAVERNS } from './caverns';
import { ROOMS_SEWERS } from './sewers';
import { ROOMS_FOREST } from './forest';
import { ROOMS_FORGE } from './forge';
import { ROOMS_RELIQUARY } from './reliquary';
import { ROOMS_CITADEL } from './citadel';
import { ROOMS_ABYSS } from './abyss';

export const ROOM_TEMPLATES: Record<number, RoomTemplate[]> = {
  1: ROOMS_CRYPT,
  2: ROOMS_CAVERNS,
  3: ROOMS_SEWERS,
  4: ROOMS_FOREST,
  5: ROOMS_FORGE,
  6: ROOMS_RELIQUARY,
  7: ROOMS_CITADEL,
  8: ROOMS_ABYSS,
};
