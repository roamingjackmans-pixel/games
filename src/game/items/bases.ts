// Item bases: what a baseId is (weapon, shield, staff, talisman, armor piece, ring) and its requirements.
import { WEAPONS } from '../../data/weapons';
import { SHIELDS } from '../../data/shields';
import { CASTING_TOOLS } from '../../data/castingTools';
import { ARMOR_SETS, armorPieceName, parseArmorBase } from '../../data/armor';
import { RINGS } from '../../data/rings';
import { reqAtIlvl } from '../combat/formulas';
import type { Item, ItemKind, Slot } from '../types';
import { weaponOf } from './weaponOf';

export interface BaseInfo {
  baseId: string;
  kind: ItemKind;
  slot: Slot;
  name: string;
  flavor: string;
}

export function baseInfo(baseId: string): BaseInfo | null {
  const w = WEAPONS[baseId];
  if (w) return { baseId, kind: 'weapon', slot: 'main', name: w.name, flavor: w.flavor };
  const s = SHIELDS[baseId];
  if (s) return { baseId, kind: 'shield', slot: 'off', name: s.name, flavor: s.flavor };
  const t = CASTING_TOOLS[baseId];
  if (t) return { baseId, kind: t.school === 'brain' ? 'staff' : 'talisman', slot: 'off', name: t.name, flavor: t.flavor };
  const r = RINGS[baseId];
  if (r) return { baseId, kind: 'ring', slot: 'ring', name: r.name, flavor: r.flavor };
  const a = parseArmorBase(baseId);
  if (a) return { baseId, kind: 'armor', slot: a.slot, name: armorPieceName(baseId), flavor: a.set?.flavor ?? 'It covers the important parts. Barely.' };
  return null;
}

/** Every base id that can drop (used by the generator and the debug menu). */
export function allBaseIds(): string[] {
  const armor: string[] = [];
  for (const s of ARMOR_SETS) for (const slot of ['head', 'body', 'legs']) armor.push(`${s.id}_${slot}`);
  return [...Object.keys(WEAPONS), ...Object.keys(SHIELDS), ...Object.keys(CASTING_TOOLS), ...armor, ...Object.keys(RINGS)];
}

export interface Requirements {
  bonk: number;
  slicey: number;
  brain: number;
  prayer: number;
}

/** Requirements at the item's level: the primary stat rises +2 per ilvl (CONTENT_ITEMS §1). */
export function itemRequirements(item: Pick<Item, 'baseId' | 'ilvl' | 'variant'>): Requirements {
  const r: Requirements = { bonk: 0, slicey: 0, brain: 0, prayer: 0 };
  // a scaling variant (D319) has its own requirements
  const w = weaponOf(item);
  const s = SHIELDS[item.baseId];
  if (w || s) {
    const req = (w ?? s)!.req;
    const bonkPrimary = req.bonk >= req.slicey;
    // D328: a weapon with even requirements (Twin Axes) raises both with item level
    const even = !!w?.reqEven;
    r.bonk = req.bonk > 0 ? reqAtIlvl(req.bonk, item.ilvl, bonkPrimary || even) : 0;
    r.slicey = req.slicey > 0 ? reqAtIlvl(req.slicey, item.ilvl, !bonkPrimary || even) : 0;
    // hybrid weapons (D80): the Brain / Prayer requirement stays at its base value like a secondary stat
    if (w?.req.brain) r.brain = w.req.brain;
    if (w?.req.prayer) r.prayer = w.req.prayer;
    return r;
  }
  const t = CASTING_TOOLS[item.baseId];
  if (t) {
    if (t.school === 'brain') r.brain = reqAtIlvl(t.req, item.ilvl, true);
    else r.prayer = reqAtIlvl(t.req, item.ilvl, true);
  }
  return r;
}

/** Two-handing counts Bonk ×1.5 toward requirements (D72); Slicey, Brain and Prayer count as they are. */
export function meetsRequirements(req: Requirements, stats: { bonk: number; slicey: number; brain: number; prayer: number }, twoHanded: boolean): boolean {
  const bonk = twoHanded ? stats.bonk * 1.5 : stats.bonk;
  return bonk >= req.bonk && stats.slicey >= req.slicey && stats.brain >= req.brain && stats.prayer >= req.prayer;
}
