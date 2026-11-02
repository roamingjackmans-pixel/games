// All bosses (CONTENT_ENEMIES §11), keyed by id. ZoneDef.boss names one per zone.
import { THE_CARETAKER } from './crypt';
import { MOTHER_SPORE } from './caverns';
import { THE_BLOATKING } from './sewers';
import type { BossDef } from '../../game/types';

export const BOSSES: Record<string, BossDef> = {
  [THE_CARETAKER.id]: THE_CARETAKER,
  [MOTHER_SPORE.id]: MOTHER_SPORE,
  [THE_BLOATKING.id]: THE_BLOATKING,
};

export function bossForZone(bossId: string): BossDef | null {
  return BOSSES[bossId] ?? null;
}
