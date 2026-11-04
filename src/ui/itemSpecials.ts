// The special perks of a weapon or shield, in words with their numbers (D171): thorns, healing on block, a walking
// penalty, bleed, backstabs, ripostes, hyper armor, ignoring guards, two hands only, charged and piercing shots.
// Everything here is read from the item's data, so a new value shows up with its real number.
import type { ShieldDef, WeaponDef } from '../game/types';

const pct = (x: number): string => `${Math.round(x * 100)}%`;
const times = (x: number): string => `×${Number(x.toFixed(2))}`;

/** One line per special perk of a weapon (none: an empty list). */
export function weaponSpecials(w: WeaponDef): string[] {
  const out: string[] = [];
  if (w.twoHandOnly) out.push('Two hands only: it cannot be used one-handed.');
  if (w.hyperArmor === 'all') out.push('Hyper armor: hits do not stagger you while it swings.');
  if (w.hyperArmor === 'last') out.push('Hyper armor on the last swing of a combo: hits do not stagger you then.');
  if (w.bleed) out.push(`Bleed: each hit builds bleed by ${w.bleed} (at 100 it bursts for 10% of an enemy's current HP, at least 3% of its max; 5% of a boss's current HP).`);
  if (w.backstabMult) out.push(`Backstab: light attacks from behind deal ${times(w.backstabMult)} damage and crit.`);
  if (w.ripostedCritMult) out.push(`Riposte: ripostes deal ${times(w.ripostedCritMult)} more (${times(2 * w.ripostedCritMult)} in all instead of ×2).`);
  if (w.ignoreFrontGuard) out.push("Ignores front guards: an enemy's raised shield does not reduce its hits.");
  const r = w.ranged;
  if (r?.chargeS) {
    const parts = [r.chargeMult && r.chargeMult !== 1 ? `${times(r.chargeMult)} damage` : '', r.chargePierce ? `pierces ${r.chargePierce} enem${r.chargePierce === 1 ? 'y' : 'ies'}` : ''].filter(Boolean);
    out.push(`Charged shot: hold for ${r.chargeS} s${parts.length ? ` for ${parts.join(' and ')}` : ''}.`);
  }
  if (r?.pierceBonk) out.push(`Piercing bolts: with ${r.pierceBonk}+ Bonk each bolt pierces 1 more enemy.`);
  return out;
}

/** One line per special perk of a shield. */
export function shieldSpecials(s: ShieldDef): string[] {
  const out: string[] = [];
  if (s.thorns) out.push(`Thorns: blocking a melee hit deals ${pct(s.thorns)} of its damage back to the attacker.`);
  if (s.blockHealPct) out.push(`Each blocked hit heals you ${pct(s.blockHealPct)} of your max HP.`);
  if (s.walkMult && s.walkMult !== 1) out.push(`Heavy to carry: ${s.walkMult < 1 ? '−' : '+'}${pct(Math.abs(1 - s.walkMult))} walking speed while it is equipped.`);
  return out;
}
