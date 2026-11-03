// CONTENT_SPELLS_CLASSES §3: the 10 classes. Every kit meets its own requirements (tested).
import type { ClassId, Stats } from '../game/types';

export interface ClassDef {
  id: ClassId;
  name: string;
  stats: Stats;
  start: { main: string; off?: string; armor: string[]; spells: string[]; bag?: string[]; gems?: number };
  twoHanded?: boolean;
  blurb: string;
  look: { skin: string; hair: string; shirt: string; legs: string; head: string; trim: string };
}

const S = (hp: number, endurance: number, bonk: number, slicey: number, brain: number, prayer: number): Stats => ({ hp, endurance, bonk, slicey, brain, prayer });

export const CLASSES: Record<ClassId, ClassDef> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    stats: S(10, 8, 10, 9, 4, 7),
    start: { main: 'longsword', off: 'kite_shield', armor: ['sextons_mail_head', 'sextons_mail_body', 'sextons_mail_legs'], spells: [] },
    blurb: 'Took the job for the armor.',
    look: { skin: '#e8c9a0', hair: '#5a3a22', shirt: '#4a6aa0', legs: '#3d3a4a', head: 'none', trim: '#c9b98a' },
  },
  brute: {
    id: 'brute',
    name: 'Brute',
    stats: S(12, 8, 14, 5, 4, 5),
    start: { main: 'greathammer', armor: ['caretakers_plate_body'], spells: [] },
    twoHanded: true,
    blurb: 'Solves things.',
    look: { skin: '#d9b088', hair: '#2a1a10', shirt: '#7a4a2a', legs: '#4a3a2a', head: 'none', trim: '#a07a4a' },
  },
  duelist: {
    id: 'duelist',
    name: 'Duelist',
    stats: S(8, 11, 5, 14, 5, 5),
    start: { main: 'twin_daggers', off: 'buckler', armor: ['crypt_rags_head', 'crypt_rags_body', 'crypt_rags_legs'], spells: [] },
    blurb: 'Has never been hit. Says so.',
    look: { skin: '#f0d0b0', hair: '#1a1a1a', shirt: '#7a2a3a', legs: '#2a2a3a', head: 'bandana', trim: '#e6b84a' },
  },
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    stats: S(7, 7, 3, 10, 15, 6),
    start: { main: 'rapier', off: 'apprentice_staff', armor: ['crypt_rags_head', 'crypt_rags_body', 'crypt_rags_legs'], spells: ['arcane_bolt', 'frost_lance'] },
    blurb: 'Read about dungeons once.',
    look: { skin: '#f0d8b8', hair: '#8a6a3a', shirt: '#3a4a8a', legs: '#2a2a3a', head: 'wizard', trim: '#e6b84a' },
  },
  cleric: {
    id: 'cleric',
    name: 'Cleric',
    stats: S(10, 7, 11, 3, 4, 13),
    start: { main: 'mace', off: 'wooden_talisman', armor: ['sextons_mail_head', 'sextons_mail_body', 'sextons_mail_legs'], spells: ['heal', 'bless_weapon'] },
    blurb: 'Prays mostly for himself.',
    look: { skin: '#e8c9a0', hair: '#c0c0c0', shirt: '#e8e1c8', legs: '#6a5a4a', head: 'mitre', trim: '#d4af37' },
  },
  spearman: {
    id: 'spearman',
    name: 'Spearman',
    stats: S(9, 9, 9, 10, 5, 6),
    start: { main: 'spear', off: 'round_shield', armor: ['sextons_mail_head', 'sextons_mail_body', 'sextons_mail_legs'], spells: [] },
    blurb: 'Keeps a polite distance.',
    look: { skin: '#d8b090', hair: '#3a2a1a', shirt: '#6a7a3a', legs: '#3a3a2a', head: 'none', trim: '#c9b98a' },
  },
  hunter: {
    id: 'hunter',
    name: 'Hunter',
    stats: S(8, 12, 5, 12, 6, 5),
    start: { main: 'bow', armor: ['crypt_rags_head', 'crypt_rags_body', 'crypt_rags_legs'], spells: [], bag: ['whip'] },
    blurb: 'Never misses. Rarely hits.',
    look: { skin: '#e0b890', hair: '#6a3a1a', shirt: '#3a5a2a', legs: '#3a3020', head: 'hood', trim: '#a0803a' },
  },
  nobody: {
    id: 'nobody',
    name: 'Nobody',
    stats: S(8, 8, 8, 8, 8, 8),
    start: { main: 'club', armor: ['loincloth_legs'], spells: [], gems: 1 },
    blurb: 'Joe.',
    look: { skin: '#e8c9a0', hair: '#4a3626', shirt: '#9a8a7a', legs: '#8a6a3a', head: 'none', trim: '#c9b98a' },
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    stats: S(10, 10, 11, 10, 3, 4),
    start: { main: 'twin_axes', armor: ['sextons_mail_body', 'sextons_mail_legs'], spells: [] },
    blurb: 'Has two of everything except plans.',
    look: { skin: '#e0b088', hair: '#a03a1a', shirt: '#5a2a1a', legs: '#3a2a1a', head: 'horned', trim: '#c9b98a' },
  },
  occultist: {
    id: 'occultist',
    name: 'Occultist',
    stats: S(7, 7, 3, 10, 15, 6),
    start: { main: 'rapier', off: 'void_staff', armor: ['crypt_rags_head', 'crypt_rags_body', 'crypt_rags_legs'], spells: ['void_rift', 'arcane_bolt'] },
    blurb: 'Found the staff in a dumpster. It found him back.',
    look: { skin: '#d8c0b0', hair: '#1a0a2a', shirt: '#2a1a3a', legs: '#1a1a2a', head: 'hood', trim: '#7a2bd6' },
  },
};

export const CLASS_IDS = Object.keys(CLASSES) as ClassId[];
