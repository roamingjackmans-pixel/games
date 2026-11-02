// All bosses (CONTENT_ENEMIES §11), keyed by id. ZoneDef.boss names one per zone. A zone file exports null
// until its boss is authored.
import { THE_CARETAKER } from './crypt';
import { MOTHER_SPORE } from './caverns';
import { THE_BLOATKING } from './sewers';
import { VEXTHORN } from './forest';
import { FOREMAN_IGNATIUS } from './forge';
import { SAINT_AURELIA } from './reliquary';
import { ARCHMAGISTER_TOCK } from './citadel';
import { THE_LANDLORD } from './abyss';
import type { BossDef } from '../../game/types';

export const BOSSES: Record<string, BossDef> = {};
for (const b of [THE_CARETAKER, MOTHER_SPORE, THE_BLOATKING, VEXTHORN, FOREMAN_IGNATIUS, SAINT_AURELIA, ARCHMAGISTER_TOCK, THE_LANDLORD]) if (b) BOSSES[b.id] = b;

export function bossForZone(bossId: string): BossDef | null {
  return BOSSES[bossId] ?? null;
}
