// What a player wears and holds, sent with the co-op lobby so each preview shows the character as they are now, not
// their class's starting kit (D170). Guests' data is untrusted: anything that is not a real base for that slot is
// dropped (the slot shows empty).
import { RARITIES, type Character, type Item } from '../types';
import { baseInfo } from '../items/bases';
import { makeItem } from '../items/make';
import { isToolItem, slotAccepts } from '../items/inventory';
import { newCharacter } from '../player/character';
import { sanitizeAppearance } from '../../data/appearance';
import { LOBBY_GEAR_SLOTS, type LobbyGear, type LobbyGearItem, type PublicPlayer } from './protocol';

/** A character's worn gear for the lobby. */
export function gearOf(c: Character): LobbyGear {
  const g: LobbyGear = { two: !!c.twoHanded };
  for (const s of LOBBY_GEAR_SLOTS) {
    const it = c.equipment[s];
    g[s] = it ? { b: it.baseId, r: it.rarity, ...(it.rarity === 'legendary' ? { n: it.name } : {}) } : null;
  }
  return g;
}

function itemFor(slot: (typeof LOBBY_GEAR_SLOTS)[number], gi: LobbyGearItem | null | undefined): Item | null {
  if (!gi || typeof gi.b !== 'string') return null;
  const info = baseInfo(gi.b);
  if (!info) return null;
  const rarity = RARITIES.includes(gi.r) ? gi.r : 'common';
  const it = makeItem(gi.b, rarity, 1, { sockets: 0 });
  if (!slotAccepts(slot, it) && !(slot === 'off' && isToolItem(it))) return null;
  if (rarity === 'legendary' && typeof gi.n === 'string') it.name = gi.n.slice(0, 60);
  return it;
}

/** A stand-in character for drawing a lobby player: their class and creator look, wearing what they sent. */
export function previewCharacter(p: PublicPlayer): Character {
  const c = newCharacter(p.classId, p.name, p.playerId);
  if (p.appearance) c.appearance = sanitizeAppearance(p.appearance, p.classId);
  const g = p.gear;
  if (!g) return c;
  for (const s of LOBBY_GEAR_SLOTS) if (s in g) c.equipment[s] = itemFor(s, g[s]);
  c.twoHanded = !!g.two;
  return c;
}
