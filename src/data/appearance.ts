// The character creator's appearance options (Character.appearance). Pure data plus three helpers: the
// class default, a seeded random pick, and a sanitizer for saves and co-op peers. lookFor() in
// src/render/entities.ts feeds the result into drawJoe.
import type { ArmFeature, Beard, Brows, EyeShape, FaceMark, HairStyle, LegFeature, NoseShape } from '../engine/draw/players';
import type { Rng } from '../engine/rng';
import type { Appearance, ClassId } from '../game/types';
import { CLASSES } from './classes';

export interface Swatch {
  id: string;
  label: string;
  hex: string;
}
export interface Choice<T extends string> {
  id: T;
  label: string;
}

export const SKIN_TONES: Swatch[] = [
  { id: 'porcelain', label: 'Porcelain', hex: '#f4dcc4' },
  { id: 'fair', label: 'Fair', hex: '#e8c9a0' },
  { id: 'warm', label: 'Warm', hex: '#d9b088' },
  { id: 'olive', label: 'Olive', hex: '#c09a6a' },
  { id: 'tan', label: 'Tan', hex: '#a87a50' },
  { id: 'brown', label: 'Brown', hex: '#8a5a38' },
  { id: 'deep', label: 'Deep', hex: '#5e3a24' },
  { id: 'ashen', label: 'Ashen', hex: '#b8b4ac' },
  { id: 'frost', label: 'Frost blue', hex: '#a8c4e0' },
  { id: 'goblin', label: 'Goblin green', hex: '#8ab06a' },
  { id: 'imp', label: 'Imp red', hex: '#c8705a' },
];

export const HAIR_COLORS: Swatch[] = [
  { id: 'black', label: 'Black', hex: '#1a1a1a' },
  { id: 'dark', label: 'Dark brown', hex: '#3a2618' },
  { id: 'brown', label: 'Brown', hex: '#6a4426' },
  { id: 'auburn', label: 'Auburn', hex: '#8a3a1e' },
  { id: 'ginger', label: 'Ginger', hex: '#c4602a' },
  { id: 'blond', label: 'Blond', hex: '#d8b45a' },
  { id: 'white', label: 'White', hex: '#e4e0d6' },
  { id: 'grey', label: 'Grey', hex: '#8a8a8a' },
  { id: 'teal', label: 'Teal', hex: '#2a9a94' },
  { id: 'violet', label: 'Violet', hex: '#7a3ab0' },
  { id: 'pink', label: 'Pink', hex: '#e07aa8' },
];

export const EYE_COLORS: Swatch[] = [
  { id: 'brown', label: 'Brown', hex: '#5a3a22' },
  { id: 'blue', label: 'Blue', hex: '#3a7ad0' },
  { id: 'green', label: 'Green', hex: '#3a9a4a' },
  { id: 'grey', label: 'Grey', hex: '#8a93a0' },
  { id: 'amber', label: 'Amber', hex: '#d89a2a' },
  { id: 'violet', label: 'Violet', hex: '#9a5ae0' },
  { id: 'red', label: 'Red', hex: '#e03a3a' },
];

export const HAIR_STYLES: Choice<HairStyle>[] = [
  { id: 'short', label: 'Short' },
  { id: 'messy', label: 'Messy' },
  { id: 'slick', label: 'Slicked' },
  { id: 'curly', label: 'Curly' },
  { id: 'spiky', label: 'Spiky' },
  { id: 'long', label: 'Long' },
  { id: 'ponytail', label: 'Ponytail' },
  { id: 'braids', label: 'Braids' },
  { id: 'topknot', label: 'Topknot' },
  { id: 'mohawk', label: 'Mohawk' },
  { id: 'afro', label: 'Afro' },
  { id: 'bald', label: 'Bald' },
];
export const BEARDS: Choice<Beard>[] = [
  { id: 'none', label: 'Clean' },
  { id: 'stubble', label: 'Stubble' },
  { id: 'moustache', label: 'Moustache' },
  { id: 'goatee', label: 'Goatee' },
  { id: 'mutton', label: 'Mutton chops' },
  { id: 'full', label: 'Full beard' },
  { id: 'long', label: 'Wizard beard' },
  { id: 'braided', label: 'Braided' },
];
export const EYE_SHAPES: Choice<EyeShape>[] = [
  { id: 'dot', label: 'Beady' },
  { id: 'round', label: 'Wide' },
  { id: 'narrow', label: 'Squint' },
  { id: 'sleepy', label: 'Sleepy' },
  { id: 'glow', label: 'Glowing' },
];
export const NOSES: Choice<NoseShape>[] = [
  { id: 'button', label: 'Button' },
  { id: 'big', label: 'Big' },
  { id: 'long', label: 'Long' },
  { id: 'hooked', label: 'Hooked' },
  { id: 'pointy', label: 'Pointy' },
  { id: 'red', label: 'Red' },
];
export const BROWS: Choice<Brows>[] = [
  { id: 'normal', label: 'Unimpressed' },
  { id: 'thick', label: 'Bushy' },
  { id: 'angry', label: 'Cross' },
  { id: 'worried', label: 'Worried' },
  { id: 'mono', label: 'Monobrow' },
  { id: 'none', label: 'None' },
];
export const MARKS: Choice<FaceMark>[] = [
  { id: 'none', label: 'None' },
  { id: 'freckles', label: 'Freckles' },
  { id: 'rosy', label: 'Rosy cheeks' },
  { id: 'scar', label: 'Scar' },
  { id: 'eyepatch', label: 'Eyepatch' },
  { id: 'warpaint', label: 'War paint' },
  { id: 'rune', label: 'Cheek rune' },
];
export const ARM_FEATURES: Choice<ArmFeature>[] = [
  { id: 'none', label: 'Arm' },
  { id: 'hook', label: 'Hook hand' },
  { id: 'wooden', label: 'Wooden arm' },
  { id: 'clockwork', label: 'Clockwork arm' },
  { id: 'missing', label: 'Tied sleeve' },
  { id: 'bandaged', label: 'Bandaged' },
  { id: 'tattoo', label: 'Tattooed' },
];
export const LEG_FEATURES: Choice<LegFeature>[] = [
  { id: 'none', label: 'Leg' },
  { id: 'peg', label: 'Peg leg' },
  { id: 'clockwork', label: 'Clockwork leg' },
  { id: 'bandaged', label: 'Bandaged' },
];

/** The look a class starts with: its own skin, hair and beard; everything else plain. */
export function defaultAppearance(classId: ClassId): Appearance {
  const cl = CLASSES[classId].look;
  return {
    skin: cl.skin,
    hair: cl.hair,
    hairStyle: (cl.hairStyle as HairStyle | undefined) ?? 'short',
    beard: (cl.beard as Beard | undefined) ?? 'stubble',
    eyes: '',
    eyeShape: 'dot',
    nose: 'button',
    brows: 'normal',
    mark: 'none',
    armL: 'none',
    armR: 'none',
    legL: 'none',
    legR: 'none',
  };
}

/** A random person (the creator's Randomize). Limb features are rarer so most rolls have all their limbs. */
export function randomAppearance(rng: Rng): Appearance {
  const pick = <T extends string>(l: Choice<T>[]): T => rng.pick(l).id;
  const limb = <T extends string>(l: Choice<T>[]): T => (rng.next() < 0.2 ? rng.pick(l.slice(1)).id : l[0]!.id);
  const fantasy = rng.next() < 0.15;
  return {
    skin: fantasy ? rng.pick(SKIN_TONES.slice(7)).hex : rng.pick(SKIN_TONES.slice(0, 7)).hex,
    hair: rng.pick(HAIR_COLORS).hex,
    hairStyle: pick(HAIR_STYLES),
    beard: pick(BEARDS),
    eyes: rng.pick(EYE_COLORS).hex,
    eyeShape: rng.next() < 0.5 ? 'dot' : pick(EYE_SHAPES),
    nose: rng.next() < 0.4 ? 'button' : pick(NOSES),
    brows: pick(BROWS),
    mark: rng.next() < 0.4 ? 'none' : pick(MARKS),
    armL: limb(ARM_FEATURES),
    armR: limb(ARM_FEATURES.filter((f) => f.id !== 'missing')),
    legL: limb(LEG_FEATURES),
    legR: limb(LEG_FEATURES),
  };
}

const HEX = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
const ok = <T extends string>(l: Choice<T>[], v: unknown, d: T): T => (l.some((x) => x.id === v) ? (v as T) : d);

/** A clean Appearance from anything (an old or edited save, a co-op peer): unknown values fall back to the class default. */
export function sanitizeAppearance(raw: unknown, classId: ClassId): Appearance {
  const d = defaultAppearance(classId);
  if (!raw || typeof raw !== 'object') return d;
  const a = raw as Record<string, unknown>;
  const hex = (v: unknown, def: string): string => (typeof v === 'string' && HEX.test(v) ? v : def);
  return {
    skin: hex(a.skin, d.skin),
    hair: hex(a.hair, d.hair),
    hairStyle: ok(HAIR_STYLES, a.hairStyle, d.hairStyle),
    beard: ok(BEARDS, a.beard, d.beard),
    eyes: a.eyes === '' ? '' : hex(a.eyes, d.eyes),
    eyeShape: ok(EYE_SHAPES, a.eyeShape, d.eyeShape),
    nose: ok(NOSES, a.nose, d.nose),
    brows: ok(BROWS, a.brows, d.brows),
    mark: ok(MARKS, a.mark, d.mark),
    armL: ok(ARM_FEATURES, a.armL, d.armL),
    armR: ok(ARM_FEATURES, a.armR, d.armR),
    legL: ok(LEG_FEATURES, a.legL, d.legL),
    legR: ok(LEG_FEATURES, a.legR, d.legR),
  };
}
