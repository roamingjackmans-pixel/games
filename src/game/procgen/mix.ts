// Zone enemy mix (PROCGEN §4): MIX_SIZE of the zone's types (D241: 5 of 10; was 4 of 8) with ≥1 melee, ≥1 non-melee,
// ≥1 Red user, ≥1 Piercing user. Each zone visit (and cycle) draws its own.
import type { Rng } from '../../engine/rng';
import { MELEE_ROLES, type EnemyDef } from '../types';

/** How many of a zone's enemy types one visit uses (D241). */
export const MIX_SIZE = 5;

export function hasKind(def: EnemyDef, kind: 'red' | 'pierce'): boolean {
  return def.attacks.some((a) => a.kind === kind);
}

export function mixValid(mix: EnemyDef[]): boolean {
  return (
    mix.length === MIX_SIZE &&
    mix.some((d) => MELEE_ROLES.includes(d.role)) &&
    mix.some((d) => !MELEE_ROLES.includes(d.role)) &&
    mix.some((d) => hasKind(d, 'red')) &&
    mix.some((d) => hasKind(d, 'pierce'))
  );
}

export function pickMix(rng: Rng, roster: EnemyDef[]): EnemyDef[] {
  if (roster.length <= MIX_SIZE) return [...roster];
  for (let i = 0; i < 500; i++) {
    const mix = rng.shuffle([...roster]).slice(0, MIX_SIZE);
    if (mixValid(mix)) return mix;
  }
  // deterministic fallback: build one greedily (always possible when the roster passes validation)
  const melee = roster.find((d) => MELEE_ROLES.includes(d.role) && hasKind(d, 'red')) ?? roster.find((d) => MELEE_ROLES.includes(d.role))!;
  const ranged = roster.find((d) => !MELEE_ROLES.includes(d.role) && hasKind(d, 'pierce')) ?? roster.find((d) => !MELEE_ROLES.includes(d.role))!;
  const out = [melee, ranged];
  for (const d of roster) if (out.length < MIX_SIZE && !out.includes(d)) out.push(d);
  return out;
}
