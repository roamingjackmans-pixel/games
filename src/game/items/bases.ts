// Item bases: what a baseId is (weapon, shield, staff, talisman, armor piece, ring) and its requirements.
import { WEAPONS } from '../../data/weapons';
import { SHIELDS } from '../../data/shields';
import { CASTING_TOOLS } from '../../data/castingTools';
import { ARMOR_SETS, armorPieceName, parseArmorBase } from '../../data/armor';
import { RINGS } from '../../data/rings';
import { reqAtIlvl } from '../combat/formulas';
import type { Item, ItemKind, Slot } from '../types';

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
export function itemRequirements(item: Pick<Item, 'baseId' | 'ilvl'>): Requirements {
  const r: Requirements = { bonk: 0, slicey: 0, brain: 0, prayer: 0 };
  const w = WEAPONS[item.baseId];
  const s = SHIELDS[item.baseId];
  if (w || s) {
    const req = (w ?? s)!.req;
    const bonkPrimary = req.bonk >= req.slicey;
    r.bonk = req.bonk > 0 ? reqAtIlvl(req.bonk, item.ilvl, bonkPrimary) : 0;
    r.slicey = req.slicey > 0 ? reqAtIlvl(req.slicey, item.ilvl, !bonkPrimary) : 0;
    return r;
  }
  const t = CASTING_TOOLS[item.baseId];
  if (t) {
    if (t.school === 'brain') r.brain = reqAtIlvl(t.req, item.ilvl, true);
    else r.prayer = reqAtIlvl(t.req, item.ilvl, true);
  }
  return r;
}

/** Two-handing counts Bonk and Slicey ×1.5 toward requirements (D37). */
export function meetsRequirements(req: Requirements, stats: { bonk: number; slicey: number; brain: number; prayer: number }, twoHanded: boolean): boolean {
  const k = twoHanded ? 1.5 : 1;
  return stats.bonk * k >= req.bonk && stats.slicey * k >= req.slicey && stats.brain >= req.brain && stats.prayer >= req.prayer;
}
