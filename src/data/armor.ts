// CONTENT_ITEMS §7: 24 armor sets (3 weights × 8 zones). The weight class sets the defense split and the
// pieces' equip load weight (D82; D35 is superseded).
import type { ArmorSetDef, ArmorWeight, DamageType } from '../game/types';
import { reinforceMult } from './essence';

export const WEIGHT_DEF: Record<ArmorWeight, Record<DamageType, number>> = {
  light: { physical: 4, magic: 7, void: 6, fire: 7, holy: 6 },
  medium: { physical: 7, magic: 5, void: 4, fire: 5, holy: 4 },
  heavy: { physical: 11, magic: 3, void: 2, fire: 3, holy: 2 },
};
export const SLOT_MULT = { head: 0.8, body: 1.4, legs: 0.8 } as const;

/**
 * Poise a piece adds (D312): your stagger threshold, in % of your max HP. Heavy armour is worth its weight here: a full
 * light set +4, medium +10, heavy +17 on the base 8.
 */
export const ARMOR_POISE: Record<ArmorWeight, { head: number; body: number; legs: number }> = {
  light: { head: 1, body: 2, legs: 1 },
  medium: { head: 2, body: 5, legs: 3 },
  heavy: { head: 4, body: 8, legs: 5 },
};
export function armorPiecePoise(baseId: string): number {
  const p = parseArmorBase(baseId);
  return p?.set ? ARMOR_POISE[p.set.weight][p.slot] : 0;
}

/** Equip load weight per piece by weight class (D82); each set is 0.85–1.15× of this (from its id). */
export const PIECE_WEIGHT: Record<ArmorWeight, { head: number; body: number; legs: number }> = {
  light: { head: 1.2, body: 3.6, legs: 1.8 },
  medium: { head: 2.8, body: 7.2, legs: 3.6 },
  heavy: { head: 5, body: 12, legs: 7 },
};

const set = (
  id: string,
  name: string,
  zone: number,
  weight: ArmorWeight,
  look: ArmorSetDef['look'],
  flavor: string,
  pieces?: [string, string, string],
): ArmorSetDef => ({
  id,
  name,
  zone,
  weight,
  pieces: { head: pieces?.[0] ?? `${name} Hood`, body: pieces?.[1] ?? `${name}`, legs: pieces?.[2] ?? `${name} Trousers` },
  look,
  flavor,
});

export const ARMOR_SETS: ArmorSetDef[] = [
  set('crypt_rags', 'Crypt Rags', 1, 'light', { head: 'hood', body: 'cloak', color: '#7a6f5a', trim: '#a9b7a0' }, 'Borrowed from a previous tenant.', ['Rag Hood', 'Crypt Rags', 'Rag Wraps']),
  set('sextons_mail', "Sexton's Mail", 1, 'medium', { head: 'cap', body: 'chain', color: '#6b7f66', trim: '#e8e1c8' }, 'Smells of candle wax and other people’s funerals.', ["Sexton's Coif", "Sexton's Mail", "Sexton's Chausses"]),
  set('caretakers_plate', "Caretaker's Plate", 1, 'heavy', { head: 'helm', body: 'plate', color: '#7d8a7a', trim: '#a9b7a0' }, 'Dented by a shovel. Repeatedly.', ["Caretaker's Helm", "Caretaker's Plate", "Caretaker's Greaves"]),
  set('sporesilk', 'Spore-Silk Wraps', 2, 'light', { head: 'hood', body: 'robe', color: '#5a3f7a', trim: '#5fd3c0' }, 'Glows faintly. Do not lick.', ['Spore-Silk Cowl', 'Spore-Silk Wraps', 'Spore-Silk Leggings']),
  set('mycelial', 'Mycelial Brigandine', 2, 'medium', { head: 'cap', body: 'leather', color: '#8b5a3c', trim: '#c58cff' }, 'Grows back when torn. Also grows.', ['Mycelial Cap', 'Mycelial Brigandine', 'Mycelial Tassets']),
  set('capshell', 'Cap-Shell Plate', 2, 'heavy', { head: 'helm', body: 'plate', color: '#6a4a6e', trim: '#5fd3c0' }, 'Made from a mushroom. It is fine.', ['Cap-Shell Helm', 'Cap-Shell Plate', 'Cap-Shell Greaves']),
  set('waders', 'Sewer Waders', 3, 'light', { head: 'bandana', body: 'leather', color: '#4a5a3a', trim: '#7d5a2e' }, 'Waterproof to the knee. The rest is up to you.', ['Sewer Bandana', 'Sewer Vest', 'Sewer Waders']),
  set('ratcatcher', "Rat-Catcher's Mail", 3, 'medium', { head: 'cap', body: 'chain', color: '#5a4a32', trim: '#8fa37a' }, 'The rats caught him first.', ["Rat-Catcher's Cap", "Rat-Catcher's Mail", "Rat-Catcher's Boots"]),
  set('drowned_king', "Drowned King's Plate", 3, 'heavy', { head: 'crown', body: 'plate', color: '#3d5a4a', trim: '#e6b84a' }, 'Let out twice for the Bloatking. Still damp. Always damp.', ["Drowned Crown", "Drowned King's Plate", "Drowned King's Greaves"]),
  set('glade', 'Glade Leathers', 4, 'light', { head: 'hood', body: 'leather', color: '#5a3a1a', trim: '#e6b84a' }, 'Smells like autumn and wolves.', ['Glade Hood', 'Glade Leathers', 'Glade Breeches']),
  set('huntsman', "Huntsman's Brigandine", 4, 'medium', { head: 'cap', body: 'leather', color: '#1f3d22', trim: '#c8621f' }, 'Lots of pockets. All have traps in them.', ["Huntsman's Cap", "Huntsman's Brigandine", "Huntsman's Leggings"]),
  set('antlerguard', 'Antlerguard Plate', 4, 'heavy', { head: 'horned', body: 'plate', color: '#6a4a2a', trim: '#e6b84a' }, 'The antlers are decorative. Mostly.', ['Antlerguard Helm', 'Antlerguard Plate', 'Antlerguard Greaves']),
  set('cultist', 'Cultist Robes', 5, 'light', { head: 'hood', body: 'robe', color: '#8e1b1b', trim: '#ff7a1a' }, 'Flame-retardant. Allegedly.', ['Cultist Cowl', 'Cultist Robes', 'Cultist Skirts']),
  set('smiths_apron', "Smith's Apron Mail", 5, 'medium', { head: 'cap', body: 'chain', color: '#4a2a1a', trim: '#ffd27a' }, 'Every link was somebody’s overtime. Wear it with a little guilt.', ["Smith's Cap", "Smith's Apron Mail", "Smith's Boots"]),
  set('forgeplate', 'Forgeplate', 5, 'heavy', { head: 'greathelm', body: 'plate', color: '#3a2020', trim: '#ff7a1a' }, 'Still warm from the shift that made it.', ['Forge Helm', 'Forgeplate', 'Forge Greaves']),
  set('choir', 'Choir Vestments', 6, 'light', { head: 'mitre', body: 'robe', color: '#f4f8ff', trim: '#d4af37' }, 'Comes with a hymn sheet. Blank.', ['Choir Mitre', 'Choir Vestments', 'Choir Slippers']),
  set('wraithwatch', 'Wraithwatch Mail', 6, 'medium', { head: 'helm', body: 'chain', color: '#3a5a8a', trim: '#9ad0ff' }, 'Watches wraiths. Wraiths watch back.', ['Wraithwatch Helm', 'Wraithwatch Mail', 'Wraithwatch Chausses']),
  set('saints_ice', "Saint's Ice Plate", 6, 'heavy', { head: 'greathelm', body: 'plate', color: '#9ad0ff', trim: '#d4af37' }, 'Never quite thaws. Neither does she.', ["Saint's Ice Helm", "Saint's Ice Plate", "Saint's Ice Greaves"]),
  set('magister', "Magister's Robes", 7, 'light', { head: 'wizard', body: 'robe', color: '#6c4ab6', trim: '#b08d3c' }, 'Tenure included.', ["Magister's Hat", "Magister's Robes", "Magister's Hose"]),
  set('cogwork', 'Cogwork Brigandine', 7, 'medium', { head: 'cap', body: 'leather', color: '#b08d3c', trim: '#2aa198' }, 'Ticks. You get used to it.', ['Cogwork Cap', 'Cogwork Brigandine', 'Cogwork Greaves']),
  set('juggernaut', 'Juggernaut Plate', 7, 'heavy', { head: 'greathelm', body: 'plate', color: '#8a6d2c', trim: '#2aa198' }, 'Steam-powered. Do not ask where the steam goes.', ['Juggernaut Helm', 'Juggernaut Plate', 'Juggernaut Greaves']),
  set('lessee', "Lessee's Suit", 8, 'light', { head: 'none', body: 'suit', color: '#1a1a22', trim: '#efe6d2' }, 'Business casual for the end of the world.', ["Lessee's Hat", "Lessee's Suit", "Lessee's Slacks"]),
  set('abyssal_scale', 'Abyssal Scale', 8, 'medium', { head: 'helm', body: 'chain', color: '#2a0d3f', trim: '#7a2bd6' }, 'The scales look back.', ['Abyssal Helm', 'Abyssal Scale', 'Abyssal Greaves']),
  set('foreclosure', 'Foreclosure Plate', 8, 'heavy', { head: 'greathelm', body: 'plate', color: '#140c1c', trim: '#7a2bd6' }, 'Final notice, wearable.', ['Foreclosure Helm', 'Foreclosure Plate', 'Foreclosure Greaves']),
];

export const ARMOR_BY_ID: Record<string, ArmorSetDef> = Object.fromEntries(ARMOR_SETS.map((s) => [s.id, s]));

/** baseId like "crypt_rags_body" → set + slot; "loincloth_legs" is Nobody's 0-defense legs. */
export function parseArmorBase(baseId: string): { set: ArmorSetDef | null; slot: 'head' | 'body' | 'legs' } | null {
  const m = /^(.*)_(head|body|legs)$/.exec(baseId);
  if (!m) return null;
  const slot = m[2] as 'head' | 'body' | 'legs';
  if (m[1] === 'loincloth') return { set: null, slot };
  const s = ARMOR_BY_ID[m[1]!];
  return s ? { set: s, slot } : null;
}

export function armorPieceName(baseId: string): string {
  const p = parseArmorBase(baseId);
  if (!p) return baseId;
  if (!p.set) return 'Loincloth';
  return p.set.pieces[p.slot];
}

/** Defense per type for one piece at an item level. */
/** A piece's defense at an item level, and its reinforcement (D198: +20% a level, ×4 at +15). */
export function armorPieceDefense(baseId: string, ilvl: number, plus = 0): Record<DamageType, number> {
  const out: Record<DamageType, number> = { physical: 0, magic: 0, void: 0, fire: 0, holy: 0 };
  const p = parseArmorBase(baseId);
  if (!p || !p.set) return out;
  const base = WEIGHT_DEF[p.set.weight];
  const k = SLOT_MULT[p.slot] * (1 + 0.6 * (ilvl - 1)) * reinforceMult(plus);
  for (const t of Object.keys(out) as DamageType[]) out[t] = base[t] * k;
  return out;
}

function setWeightFactor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return 0.85 + (Math.abs(h) % 31) / 100;
}

/** Equip load weight of one armor piece (D82), to one decimal. The Loincloth weighs almost nothing. */
export function armorPieceWeight(baseId: string): number {
  const p = parseArmorBase(baseId);
  if (!p) return 0;
  if (!p.set) return 0.2;
  return Math.round(PIECE_WEIGHT[p.set.weight][p.slot] * setWeightFactor(p.set.id) * 10) / 10;
}
