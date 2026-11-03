// CONTENT_ITEMS §8: rings (2 slots). Effects are applied in player/derived.ts by id.
import type { RingDef } from '../game/types';

export const RINGS: Record<string, RingDef> = {
  lucky_charm: { id: 'lucky_charm', name: 'Lucky Charm', floor: 'uncommon', effect: '+10% Shard find.', flavor: 'Gary swears it works. Gary also swears it’s silver.' },
  thermos_lid: { id: 'thermos_lid', name: 'Thermos Lid', floor: 'rare', effect: 'Flask heals +15%.', flavor: 'A ring, technically.' },
  band_bonk: { id: 'band_bonk', name: 'Band of Bonk', floor: 'rare', effect: '+3 Bonk (+5 Epic, +8 Legendary).', flavor: 'Heavier than it looks.' },
  band_slicey: { id: 'band_slicey', name: 'Band of Slicey', floor: 'rare', effect: '+3 Slicey (+5 Epic, +8 Legendary).', flavor: 'Sharp edges. Wear gloves.' },
  band_brain: { id: 'band_brain', name: 'Band of Brain', floor: 'rare', effect: '+3 Brain (+5 Epic, +8 Legendary).', flavor: 'Makes you feel smart. That is all it does.' },
  band_prayer: { id: 'band_prayer', name: 'Band of Prayer', floor: 'rare', effect: '+3 Prayer (+5 Epic, +8 Legendary).', flavor: 'Blessed in bulk.' },
  band_vigor: { id: 'band_vigor', name: 'Band of Vigor', floor: 'rare', effect: '+3 Stamina (+5 Epic, +8 Legendary).', flavor: 'Smells of strong tea and stubbornness.' },
  band_health: { id: 'band_health', name: 'Band of Health', floor: 'rare', effect: '+3 HP (+5 Epic, +8 Legendary).', flavor: 'Your mum would approve.' },
  fleet_ring: { id: 'fleet_ring', name: 'Fleet Ring', floor: 'rare', effect: '−0.5 s dodge recharge.', flavor: 'Runs in the family.' },
  ring_stillness: { id: 'ring_stillness', name: 'Ring of Stillness', floor: 'epic', effect: 'Standing still 1 s grants +15% damage.', flavor: 'Patience, weaponised.' },
  chloranthy_knot: { id: 'chloranthy_knot', name: 'Chloranthy Knot', floor: 'epic', effect: '+20% stamina regen.', flavor: 'Breathes in for you when you haven’t the time.' },
  glowcatcher: { id: 'glowcatcher', name: 'Glowcatcher', floor: 'epic', effect: '+25% gem drop chance, +20% Glowen.', flavor: 'Glowen sticks to it like gossip.' },
  red_thread: { id: 'red_thread', name: 'Red Thread', floor: 'legendary', effect: 'Blocking is impossible; Red attacks deal −25% to you.', flavor: 'Tied around a finger. Remember to dodge.' },
  ghost_lantern: { id: 'ghost_lantern', name: 'Ghost Lantern', floor: 'legendary', effect: 'Your hits on ghosts count double for reviving.', flavor: 'For friends who fell down the stairs.' },
  slumlords_signet: { id: 'slumlords_signet', name: "Slumlord's Signet", floor: 'legendary', effect: '+15% damage, −15% max HP.', flavor: 'Pays well. Takes its cut out of you first.' },
};

export const RING_IDS = Object.keys(RINGS);

export function bandStat(ringId: string): 'bonk' | 'slicey' | 'brain' | 'prayer' | 'endurance' | 'hp' | null {
  switch (ringId) {
    case 'band_bonk':
      return 'bonk';
    case 'band_slicey':
      return 'slicey';
    case 'band_brain':
      return 'brain';
    case 'band_prayer':
      return 'prayer';
    case 'band_vigor':
      return 'endurance';
    case 'band_health':
      return 'hp';
    default:
      return null;
  }
}

export function bandAmount(rarity: string): number {
  return rarity === 'legendary' ? 8 : rarity === 'epic' ? 5 : 3;
}
