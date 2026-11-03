// The five damage types (D80): their colours, names and the weakness chart (D81).
// Pure data and functions: safe to import from game, render and UI code alike.
import type { BossDef, DamageType, EnemyDef } from './types';

export interface ElementLook {
  name: string;
  short: string;
  /** the type's own colour (bodies, armour tints, item text on light backgrounds) */
  main: string;
  /** a brighter shade that reads on the dark dungeon floor (glows, telegraph sparks, swing trails) */
  glow: string;
  /** a deep shade for shadows and undersides */
  deep: string;
}

export const ELEMENTS: Record<DamageType, ElementLook> = {
  physical: { name: 'Physical', short: 'Phys', main: '#ece6da', glow: '#ffffff', deep: '#8a8478' },
  magic: { name: 'Magic', short: 'Magic', main: '#3f8cff', glow: '#7cc4ff', deep: '#1a3f8a' },
  void: { name: 'Void', short: 'Void', main: '#2a2631', glow: '#9a93ab', deep: '#0d0b11' },
  fire: { name: 'Fire', short: 'Fire', main: '#e33b22', glow: '#ff7a3a', deep: '#7a1608' },
  holy: { name: 'Holy', short: 'Holy', main: '#f0c43c', glow: '#ffe98a', deep: '#8a6a10' },
};

export function elementColor(t: DamageType): string {
  return ELEMENTS[t].main;
}
export function elementGlow(t: DamageType): string {
  return ELEMENTS[t].glow;
}

/**
 * The weakness chart (D81). Physical is neutral to everything and everything is neutral to Physical.
 * Magic beats Holy, Holy beats Void, Void beats Fire, Fire beats Magic (and each loses to the one that beats it).
 */
export const STRONG_VS: Partial<Record<DamageType, DamageType>> = { magic: 'holy', holy: 'void', void: 'fire', fire: 'magic' };
export const WEAK_VS: Partial<Record<DamageType, DamageType>> = { magic: 'fire', holy: 'magic', void: 'holy', fire: 'void' };
export const STRONG_MULT = 1.5;
export const WEAK_MULT = 0.6;

/** Damage multiplier for an attack of type `attack` landing on a body of type `defender`. */
export function affinityMult(attack: DamageType, defender: DamageType): number {
  if (STRONG_VS[attack] === defender) return STRONG_MULT;
  if (WEAK_VS[attack] === defender) return WEAK_MULT;
  return 1;
}

const elementCache = new Map<string, DamageType>();

/**
 * An enemy's type: the damage type of most of what it does (attacks weighted by how often the AI picks them,
 * boss phases all counted). Anything under half elemental is Physical. `def.element` overrides.
 */
export function enemyElement(def: Pick<EnemyDef, 'id'> & { element?: DamageType; attacks?: EnemyDef['attacks']; phases?: BossDef['phases'] }): DamageType {
  if (def.element) return def.element;
  const hit = elementCache.get(def.id);
  if (hit) return hit;
  const tally: Partial<Record<DamageType, number>> = {};
  let total = 0;
  const add = (list: { type: DamageType; weight: number; kind: string; trigger?: string }[] | undefined): void => {
    for (const a of list ?? []) {
      if (a.kind === 'utility' || a.trigger) continue;
      const wgt = Math.max(0.5, a.weight || 1);
      tally[a.type] = (tally[a.type] ?? 0) + wgt;
      total += wgt;
    }
  };
  add(def.attacks);
  for (const p of def.phases ?? []) add(p.attacks);
  let best: DamageType = 'physical';
  let bestN = 0;
  for (const [t, n] of Object.entries(tally) as [DamageType, number][]) {
    if (t === 'physical') continue;
    if (n > bestN) {
      best = t;
      bestN = n;
    }
  }
  const out = total > 0 && bestN / total >= 0.5 ? best : 'physical';
  elementCache.set(def.id, out);
  return out;
}

/** Plain-language chart line for tooltips and the codex: "Weak to Fire · Resists Void". */
export function chartLine(t: DamageType): string {
  if (t === 'physical') return 'No weakness';
  const weakTo = (Object.keys(STRONG_VS) as DamageType[]).find((k) => STRONG_VS[k] === t);
  const resists = (Object.keys(WEAK_VS) as DamageType[]).find((k) => WEAK_VS[k] === t);
  return `Weak to ${ELEMENTS[weakTo!].name} · Resists ${ELEMENTS[resists!].name}`;
}
