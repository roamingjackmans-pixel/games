// Character creation from a class (CONTENT_SPELLS_CLASSES §3) and level/stat helpers.
import { CLASSES } from '../../data/classes';
import { GEM_FAMILIES, makeGem, rollGemQuality } from '../../data/gems';
import { SPELLS } from '../../data/spells';
import type { Rng } from '../../engine/rng';
import { makeItem } from '../items/make';
import type { Character, ClassId, Gem, Item, StatId } from '../types';
import { STAT_CAP, pointsForLevel } from '../combat/formulas';

export function newCharacter(classId: ClassId, name: string, playerId: string, rng?: Rng): Character {
  const cls = CLASSES[classId];
  const mk = (b: string): Item => (rng ? makeItem(b, 'common', 1, { rng }) : makeItem(b, 'common', 1));
  const equipment: Character['equipment'] = { main: mk(cls.start.main), off: null, head: null, body: null, legs: null, ring1: null, ring2: null, ring3: null, ring4: null };
  if (cls.start.off) equipment.off = mk(cls.start.off);
  for (const a of cls.start.armor) {
    const it = mk(a);
    if (it.slot === 'head' || it.slot === 'body' || it.slot === 'legs') equipment[it.slot] = it;
  }
  const gems: Gem[] = [];
  for (let i = 0; i < (cls.start.gems ?? 0); i++) gems.push(makeGem(rng ? rng.pick(GEM_FAMILIES) : 'brutal', { level: 1, q: rng ? rollGemQuality(rng) : 0 }));
  const altMain = cls.start.alt ? mk(cls.start.alt) : null;
  // each starting spell goes in its own school's loadout, in order
  const loadoutOf = (school: 'brain' | 'prayer'): [string | null, string | null, string | null] => {
    const ids = cls.start.spells.filter((id) => SPELLS[id]?.school === school);
    return [ids[0] ?? null, ids[1] ?? null, ids[2] ?? null];
  };
  return {
    playerId,
    name: name.trim() || 'Joe',
    classId,
    level: 1,
    stats: { ...cls.stats },
    shards: 0,
    glowen: 0,
    flaskMax: 1,
    flaskCur: 1,
    bossesBeaten: 0,
    highestZoneBeaten: 0,
    cycle: 0,
    equipment,
    altMain,
    altOff: null,
    twoHanded: !!cls.twoHanded,
    bag: (cls.start.bag ?? []).map(mk),
    gems,
    consumables: { throwing_knife: 3 },
    quickSlot: 'throwing_knife',
    knownSpells: [...cls.start.spells],
    spellLoadout: {
      brain: loadoutOf('brain'),
      prayer: loadoutOf('prayer'),
    },
    freePoints: 0,
    tutorialDone: false,
  };
}

export function statTotal(c: Character): number {
  return c.stats.hp + c.stats.endurance + c.stats.bonk + c.stats.slicey + c.stats.brain + c.stats.prayer;
}

/** Level = 1 + points bought (48 base points). */
export function levelFromStats(c: Character): number {
  return Math.max(1, statTotal(c) - 47);
}

export function canRaise(c: Character, stat: StatId): boolean {
  return c.stats[stat] < STAT_CAP;
}

export function expectedPoints(level: number): number {
  return pointsForLevel(level);
}
