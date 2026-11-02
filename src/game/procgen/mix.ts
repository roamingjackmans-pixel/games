// Zone enemy mix (PROCGEN §4): 4 of the zone's 8 types with ≥1 melee, ≥1 non-melee, ≥1 Red user, ≥1 Piercing user.
import type { Rng } from '../../engine/rng';
import { MELEE_ROLES, type EnemyDef } from '../types';

export function hasKind(def: EnemyDef, kind: 'red' | 'pierce'): boolean {
  return def.attacks.some((a) => a.kind === kind);
}

export function mixValid(mix: EnemyDef[]): boolean {
  return (
    mix.length === 4 &&
    mix.some((d) => MELEE_ROLES.includes(d.role)) &&
    mix.some((d) => !MELEE_ROLES.includes(d.role)) &&
    mix.some((d) => hasKind(d, 'red')) &&
    mix.some((d) => hasKind(d, 'pierce'))
  );
}

export function pickMix(rng: Rng, roster: EnemyDef[]): EnemyDef[] {
  if (roster.length < 4) return [...roster];
  for (let i = 0; i < 500; i++) {
    const mix = rng.shuffle([...roster]).slice(0, 4);
    if (mixValid(mix)) return mix;
  }
  // deterministic fallback: build one greedily (always possible when the roster passes validation)
  const melee = roster.find((d) => MELEE_ROLES.includes(d.role) && hasKind(d, 'red')) ?? roster.find((d) => MELEE_ROLES.includes(d.role))!;
  const ranged = roster.find((d) => !MELEE_ROLES.includes(d.role) && hasKind(d, 'pierce')) ?? roster.find((d) => !MELEE_ROLES.includes(d.role))!;
  const out = [melee, ranged];
  for (const d of roster) if (out.length < 4 && !out.includes(d)) out.push(d);
  return out;
}
