// The weapon an item really is (D319): its class with the item's scaling variant, if it rolled one, laid over it
// (grades, requirements, damage type). Everything that reads a weapon item's grades or element asks this.
import { WEAPONS } from '../../data/weapons';
import { VARIANT_REQ, WEAPON_VARIANTS, type WeaponVariantDef } from '../../data/weaponVariants';
import type { Grade, Item, WeaponDef } from '../types';

const ORDER: Grade[] = ['-', 'E', 'D', 'C', 'B', 'A', 'S'];
const cache = new Map<string, WeaponDef>();

export function variantOf(item: Pick<Item, 'baseId' | 'variant'> | null | undefined): WeaponVariantDef | undefined {
  if (!item?.variant) return undefined;
  return WEAPON_VARIANTS[item.baseId]?.find((v) => v.id === item.variant);
}

/** A class with a variant laid over it: a stat it newly needs asks VARIANT_REQ; a lowered grade lowers its requirement. */
export function applyVariant(def: WeaponDef, v: WeaponVariantDef): WeaponDef {
  const key = `${def.id}|${v.id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const req: WeaponDef['req'] = { bonk: 0, slicey: 0 };
  for (const k of ['bonk', 'slicey', 'brain', 'prayer'] as const) {
    const g = v.grades[k];
    if (!g || g === '-') {
      if (k === 'bonk' || k === 'slicey') req[k] = 0;
      continue;
    }
    const base = def.req[k] ?? 0;
    const baseG = def.grades[k] ?? '-';
    req[k] = base > 0 ? (ORDER.indexOf(g) < ORDER.indexOf(baseG) ? Math.min(base, VARIANT_REQ[g]) : base) : VARIANT_REQ[g];
  }
  // a big Bonk weapon stays heavy whatever its scaling (D329)
  if (def.bonkFloor && req.bonk > 0) req.bonk = Math.max(req.bonk, def.bonkFloor);
  const out: WeaponDef = { ...def, grades: { ...v.grades }, req };
  if (v.element) out.element = v.element;
  cache.set(key, out);
  return out;
}

/** The weapon def for a weapon item, its variant applied; undefined for anything that is not a weapon. */
export function weaponOf(item: Pick<Item, 'baseId' | 'variant'> | null | undefined): WeaponDef | undefined {
  if (!item) return undefined;
  const def = WEAPONS[item.baseId];
  if (!def) return undefined;
  const v = variantOf(item);
  return v ? applyVariant(def, v) : def;
}
