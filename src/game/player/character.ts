// Character creation from a class (CONTENT_SPELLS_CLASSES §3) and level/stat helpers.
import { CLASSES } from '../../data/classes';
import { GEM_FAMILIES } from '../../data/gems';
import type { Rng } from '../../engine/rng';
import { makeItem } from '../items/make';
import type { Character, ClassId, Gem, Item, StatId } from '../types';
import { pointsForLevel } from '../combat/formulas';

export function newCharacter(classId: ClassId, name: string, playerId: string, rng?: Rng): Character {
  const cls = CLASSES[classId];
  const mk = (b: string): Item => (rng ? makeItem(b, 'common', 1, { rng }) : makeItem(b, 'common', 1));
  const equipment: Character['equipment'] = { main: mk(cls.start.main), off: null, head: null, body: null, legs: null, ring1: null, ring2: null };
  if (cls.start.off) equipment.off = mk(cls.start.off);
  for (const a of cls.start.armor) {
    const it = mk(a);
    if (it.slot === 'head' || it.slot === 'body' || it.slot === 'legs') equipment[it.slot] = it;
  }
  const gems: Gem[] = [];
  for (let i = 0; i < (cls.start.gems ?? 0); i++) gems.push({ family: rng ? rng.pick(GEM_FAMILIES) : 'brutal', tier: 1 });
  const school = cls.start.off?.includes('staff') ? 'brain' : 'prayer';
  const loadout: [string | null, string | null, string | null] = [cls.start.spells[0] ?? null, cls.start.spells[1] ?? null, null];
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
    altMain: null,
    twoHanded: !!cls.twoHanded,
    bag: (cls.start.bag ?? []).map(mk),
    gems,
    consumables: { throwing_knife: 3 },
    quickSlot: 'throwing_knife',
    knownSpells: [...cls.start.spells],
    spellLoadout: {
      brain: school === 'brain' ? loadout : [null, null, null],
      prayer: school === 'prayer' ? loadout : [null, null, null],
    },
    tears: 0,
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
  return c.stats[stat] < 99;
}

/** Reset stats to the class base, keeping the level's points as unspent (refunded as levels to re-buy). */
export function respecStats(c: Character): number {
  const base = CLASSES[c.classId].stats;
  const refund = statTotal(c) - (base.hp + base.endurance + base.bonk + base.slicey + base.brain + base.prayer);
  c.stats = { ...base };
  return refund;
}

export function expectedPoints(level: number): number {
  return pointsForLevel(level);
}
