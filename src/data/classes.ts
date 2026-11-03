// CONTENT_SPELLS_CLASSES §3: the 10 classes. Every kit meets its own requirements (tested).
import type { ClassId, Stats } from '../game/types';

export interface ClassDef {
  id: ClassId;
  name: string;
  stats: Stats;
  /** `alt` is the 2nd (quick-swap) weapon slot: a weapon, staff or talisman (D117) */
  start: { main: string; off?: string; alt?: string; armor: string[]; spells: string[]; bag?: string[]; gems?: number };
  twoHanded?: boolean;
  blurb: string;
  look: {
    skin: string;
    hair: string;
    shirt: string;
    legs: string;
    head: string;
    trim: string;
    /** the person under the armor */
    hairStyle?: string;
    beard?: string;
    /** colour of the class's own hat/hood/helm (defaults to trim) */
    hat?: string;
    /** belt and chest device on the unarmored tunic */
    belt?: string;
    emblem?: string;
  };
}

const S = (hp: number, endurance: number, bonk: number, slicey: number, brain: number, prayer: number): Stats => ({ hp, endurance, bonk, slicey, brain, prayer });

export const CLASSES: Record<ClassId, ClassDef> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    stats: S(10, 8, 10, 9, 4, 7),
    start: { main: 'longsword', off: 'kite_shield', armor: ['sextons_mail_head', 'sextons_mail_body', 'sextons_mail_legs'], spells: [] },
    blurb: 'Took the job for the armour. The job came with stairs.',
    look: { skin: '#e8c9a0', hair: '#5a3a22', shirt: '#4a6aa0', legs: '#3d3a4a', head: 'none', trim: '#c9b98a', hairStyle: 'short', beard: 'stubble', belt: '#5a3a22', emblem: 'cross' },
  },
  brute: {
    id: 'brute',
    name: 'Brute',
    stats: S(12, 8, 14, 5, 4, 5),
    start: { main: 'greathammer', armor: ['caretakers_plate_body'], spells: [] },
    twoHanded: true,
    blurb: 'Solves things.',
    look: { skin: '#d9b088', hair: '#2a1a10', shirt: '#7a4a2a', legs: '#4a3a2a', head: 'none', trim: '#a07a4a', hairStyle: 'bald', beard: 'full', belt: '#3a2414' },
  },
  duelist: {
    id: 'duelist',
    name: 'Duelist',
    stats: S(8, 11, 5, 14, 5, 5),
    start: { main: 'twin_daggers', off: 'buckler', armor: ['crypt_rags_head', 'crypt_rags_body', 'crypt_rags_legs'], spells: [] },
    blurb: 'Has never been hit. Says so.',
    look: { skin: '#f0d0b0', hair: '#1a1a1a', shirt: '#7a2a3a', legs: '#2a2a3a', head: 'bandana', trim: '#e6b84a', hairStyle: 'slick', beard: 'moustache', hat: '#a02030', belt: '#1a1a1a' },
  },
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    stats: S(7, 7, 3, 10, 15, 6),
    start: { main: 'rapier', off: 'apprentice_staff', armor: ['crypt_rags_head', 'crypt_rags_body', 'crypt_rags_legs'], spells: ['arcane_bolt', 'frost_lance'] },
    blurb: 'Read about dungeons once.',
    look: { skin: '#f0d8b8', hair: '#8a6a3a', shirt: '#3a4a8a', legs: '#2a2a3a', head: 'wizard', trim: '#e6b84a', hairStyle: 'long', beard: 'goatee', hat: '#3a4a8a', belt: '#e6b84a', emblem: 'star' },
  },
  // id kept for saves; the Cleric became the Pyre Priest, a fire-and-brimstone healer (D118)
  cleric: {
    id: 'cleric',
    name: 'Pyre Priest',
    stats: S(10, 7, 11, 3, 4, 13),
    // no helm: the ember mitre shows
    start: { main: 'censer_flail', off: 'wooden_talisman', armor: ['sextons_mail_body', 'sextons_mail_legs'], spells: ['heal', 'bless_weapon'] },
    blurb: 'Heals the faithful. Cremates the rest. Same sermon either way.',
    look: { skin: '#e8c9a0', hair: '#c0c0c0', shirt: '#9a2a1a', legs: '#3a2420', head: 'mitre', trim: '#ff9a2a', hairStyle: 'bald', beard: 'full', hat: '#c8401a', belt: '#ffb84a', emblem: 'flame' },
  },
  // id kept for saves; the Spearman became the Battlemage: colossal sword and shield, a staff on the swap (D119)
  spearman: {
    id: 'spearman',
    name: 'Battlemage',
    stats: S(7, 7, 13, 8, 10, 3),
    start: { main: 'colossal_sword', off: 'targe', alt: 'apprentice_staff', armor: ['crypt_rags_body', 'crypt_rags_legs'], spells: ['arcane_bolt', 'scatter_shards'] },
    blurb: 'Read one book on magic. Hit the librarian with a sword the size of the shelf.',
    look: { skin: '#d8b090', hair: '#3a2a1a', shirt: '#34508a', legs: '#2a2a3a', head: 'wizard', trim: '#8fd3ff', hairStyle: 'topknot', beard: 'full', hat: '#2a3a6a', belt: '#5a4a2a', emblem: 'star' },
  },
  hunter: {
    id: 'hunter',
    name: 'Hunter',
    stats: S(8, 12, 5, 12, 6, 5),
    start: { main: 'bow', armor: ['crypt_rags_head', 'crypt_rags_body', 'crypt_rags_legs'], spells: [], bag: ['whip'] },
    twoHanded: true,
    blurb: 'Can track anything. Mostly tracks in mud.',
    look: { skin: '#e0b890', hair: '#6a3a1a', shirt: '#3a5a2a', legs: '#3a3020', head: 'hood', trim: '#a0803a', hairStyle: 'short', beard: 'stubble', hat: '#3a5a2a', belt: '#3a2a1a', emblem: 'leaf' },
  },
  // id kept for saves; the Occultist became the Zealot, Slicey + Prayer with the Dawn Glaive (D121)
  occultist: {
    id: 'occultist',
    name: 'Zealot',
    stats: S(8, 8, 3, 12, 3, 14),
    start: { main: 'dawn_glaive', off: 'silver_talisman', armor: ['sextons_mail_head', 'sextons_mail_body', 'sextons_mail_legs'], spells: ['sunray', 'bless_weapon'] },
    blurb: 'Up at five to pray. Up at five past to stab whoever was not.',
    look: { skin: '#d8c0b0', hair: '#e8d8a0', shirt: '#efe6d2', legs: '#5a4a2a', head: 'hood', trim: '#e6b84a', hairStyle: 'long', beard: 'none', hat: '#d8c8a0', belt: '#e6b84a', emblem: 'sun' },
  },
  // dual daggers with real Bonk and Slicey behind them (D123; was HP/Endurance-heavy, D120)
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    stats: S(10, 7, 13, 14, 2, 2), // D123: Bonk 13 and Slicey 14 (Twin Daggers need Slicey 14)
    start: { main: 'twin_daggers', armor: ['sextons_mail_body', 'sextons_mail_legs'], spells: [] },
    twoHanded: true,
    blurb: 'Was asked to calm down once. Once. Has never been asked to count.',
    look: { skin: '#e0b088', hair: '#a03a1a', shirt: '#5a2a1a', legs: '#3a2a1a', head: 'horned', trim: '#c9b98a', hairStyle: 'braids', beard: 'braided', hat: '#7a7f88', belt: '#2a1a10' },
  },
  // id kept for saves; the Occultist became the Zealot, Slicey + Prayer with the Dawn Glaive (D121)
  nobody: {
    id: 'nobody',
    name: 'Nobody',
    stats: S(8, 8, 8, 8, 8, 8),
    start: { main: 'club', armor: ['loincloth_legs'], spells: [], gems: 1 },
    blurb: 'Joe.',
    look: { skin: '#e8c9a0', hair: '#4a3626', shirt: '#9a8a7a', legs: '#8a6a3a', head: 'none', trim: '#c9b98a', hairStyle: 'messy', beard: 'stubble' },
  },
  // dual daggers with real Bonk and Slicey behind them (D123; was HP/Endurance-heavy, D120)
};

export const CLASS_IDS = Object.keys(CLASSES) as ClassId[];
