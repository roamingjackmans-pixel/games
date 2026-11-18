// Neon legendary armor (D442): every legendary armor piece has six bright versions, found only in a Hardcore campaign.
// The colour is the whole difference: a neon piece has the stats of the piece it recolours.
import type { Item, NeonColor } from '../game/types';

export interface NeonDef {
  id: NeonColor;
  name: string;
  /** the main colour of the piece */
  color: string;
  /** trim, rivets and glowing seams */
  light: string;
  /** boots, cape linings and surcoats */
  deep: string;
}

export const NEON_COLORS: Record<NeonColor, NeonDef> = {
  blue: { id: 'blue', name: 'Neon Blue', color: '#12d9ff', light: '#b8f6ff', deep: '#0077ff' },
  pink: { id: 'pink', name: 'Neon Pink', color: '#ff2fc4', light: '#ffc2ee', deep: '#c4008a' },
  green: { id: 'green', name: 'Neon Green', color: '#39ff14', light: '#ccffbd', deep: '#00b82e' },
  purple: { id: 'purple', name: 'Neon Purple', color: '#b026ff', light: '#e5bcff', deep: '#6a00e0' },
  red: { id: 'red', name: 'Neon Red', color: '#ff1a35', light: '#ffb3bc', deep: '#c00018' },
  orange: { id: 'orange', name: 'Neon Orange', color: '#ff7a00', light: '#ffd199', deep: '#d14a00' },
};

export const NEON_IDS = Object.keys(NEON_COLORS) as NeonColor[];

/** How often a legendary armor piece found in a Hardcore campaign is a neon one. */
export const NEON_ARMOR_CHANCE = 0.5;

/** A colour id from anywhere (a co-op peer's data is untrusted). */
export function isNeonColor(v: unknown): v is NeonColor {
  return typeof v === 'string' && (NEON_IDS as string[]).includes(v);
}

/** The neon colour of a piece of armor, if it has one. */
export function neonOf(item: Pick<Item, 'kind' | 'neon'> | null | undefined): NeonDef | null {
  return item?.kind === 'armor' && isNeonColor(item.neon) ? NEON_COLORS[item.neon] : null;
}
