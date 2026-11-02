// EffectDef executor (shared by skills, spells, consumables, legendary powers, elite affixes, enemy utilities).
// Filled in at M3/M6; M2 only needs the type.
import type { EffectDef, Team } from '../types';
import type { World } from '../world';

export interface EffectCtx {
  sourceId: number;
  team: Team;
  x: number;
  y: number;
  aimX: number;
  aimY: number;
  targetId: number;
  powerMult: number;
  isSpell: boolean;
  isSkill: boolean;
  /** the base damage that `mult` multiplies (weapon power for skills, role hit for enemies) */
  baseDamage: number;
  /** telegraph time for pattern damage effects (0 = instant) */
  windupS: number;
  tag: string;
}

export function runEffects(_w: World, _effects: EffectDef[], _ctx: EffectCtx): void {}
