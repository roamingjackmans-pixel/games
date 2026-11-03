// Achievements (GAME_DESIGN §20): the data table, the stored record, unlocking from counters and world events,
// and The Dark Shard.
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, DARK_SHARD } from '../../src/data/achievements';
import { BOSSES } from '../../src/data/bosses';
import { CLASS_IDS } from '../../src/data/classes';
import { ACH_KEY, AchievementTracker, loadRecord, normalizeRecord, wearsFullSet } from '../../src/game/achievements';
import { MemoryStore } from '../../src/engine/settings';
import { World, type GameEvent } from '../../src/game/world';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import type { Character } from '../../src/game/types';

function setup(): { t: AchievementTracker; store: MemoryStore; w: World; c: Character } {
  const store = new MemoryStore();
  const t = new AchievementTracker(store, () => 1_700_000_000_000);
  const w = new World('ACH');
  const c = newCharacter('knight', 'Joe', 'p1', new Rng('ACH'));
  return { t, store, w, c };
}

const death = (id: number, defId: string): GameEvent => ({ t: 'death', id, x: 0, y: 0, isPlayer: false, defId });

describe('achievement data', () => {
  it('has 35–50 achievements with unique ids, names and descriptions', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(35);
    expect(ACHIEVEMENTS.length).toBeLessThanOrEqual(50);
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.name.length).toBeGreaterThan(2);
      expect(a.desc.length).toBeGreaterThan(5);
    }
  });

  it('covers every boss, every class and The Dark Shard', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    expect(Object.keys(BOSSES)).toHaveLength(8);
    for (const b of Object.keys(BOSSES)) expect(ids.has(`boss_${b}`)).toBe(true);
    for (const c of CLASS_IDS) expect(ids.has(`class_${c}`)).toBe(true);
    for (const id of ['beat_game', 'ng_plus', 'ng_plus_2', 'instructor', 'kills_5000', 'mimic_death', 'gary_gone']) expect(ids.has(id)).toBe(true);
    const dark = ACHIEVEMENTS.find((a) => a.id === DARK_SHARD)!;
    expect(dark.name).toBe('The Dark Shard');
  });

  it('nothing is unlocked on an empty record', () => {
    const { t } = setup();
    expect(t.evaluate()).toEqual([]);
    expect(t.totals()).toEqual([0, ACHIEVEMENTS.length]);
  });
});

describe('stored record', () => {
  it('survives a missing, corrupt or odd record', () => {
    const s = new MemoryStore();
    expect(loadRecord(s).unlocked).toEqual({});
    s.setItem(ACH_KEY, '{not json');
    expect(loadRecord(s).counters).toEqual({});
    s.setItem(ACH_KEY, JSON.stringify([1, 2, 3]));
    expect(loadRecord(s).unlocked).toEqual({});
    const r = normalizeRecord({ unlocked: { first_blood: 5, bad: 'x', neg: -1 }, counters: { kills: 12, nan: null, inf: Infinity } });
    expect(r.unlocked).toEqual({ first_blood: 5 });
    expect(r.counters).toEqual({ kills: 12 });
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); }, removeItem: () => undefined };
    const t = new AchievementTracker(broken);
    t.add('kills');
    expect(t.unlocked('first_blood')).toBe(true);
  });

  it('is account-wide: a second tracker on the same store sees the unlocks and counters', () => {
    const { t, store } = setup();
    t.add('kills', 100);
    t.flush();
    const t2 = new AchievementTracker(store);
    expect(t2.unlocked('kills_100')).toBe(true);
    expect(t2.view.count('kills')).toBe(100);
    expect(t2.unlockedAt('first_blood')).toBe(1_700_000_000_000);
  });
});

describe('unlocking', () => {
  it('counters unlock at their targets and fire listeners once', () => {
    const { t } = setup();
    const got: string[] = [];
    t.onUnlock((a) => got.push(a.id));
    t.add('kills', 99);
    expect(got).toEqual(['first_blood']);
    expect(ACHIEVEMENTS.find((a) => a.id === 'kills_100')!.progress!(t.view)).toEqual([99, 100]);
    t.add('kills');
    t.add('kills');
    expect(got).toEqual(['first_blood', 'kills_100']);
    t.max('level', 50);
    t.max('level', 12);
    expect(t.view.count('level')).toBe(50);
    expect(t.unlocked('level_50')).toBe(true);
  });

  it('reads kills, bosses, NG+ cycles, parries and ripostes from the world events', () => {
    const { t, w, c } = setup();
    t.begin();
    w.zone = 8;
    w.cycle = 2;
    t.frame(w, null, c, [death(5, 'dummy_still'), death(6, 'mimic')]);
    expect(t.view.count('kills')).toBe(1);
    expect(t.unlocked('mimic_kill')).toBe(true);
    // a boss fight without the Thermos, a weapon in hand
    w.bossId = 40;
    t.frame(w, null, c, []);
    w.bossId = 0;
    t.frame(w, null, c, [death(40, 'the_landlord')]);
    for (const id of ['boss_the_landlord', 'ng_plus', 'ng_plus_2', 'flaskless', 'class_knight']) expect(t.unlocked(id)).toBe(true);
    expect(t.unlocked('fists')).toBe(false);
    // parries count only for the local player
    t.frame(w, null, c, [{ t: 'parry', x: 0, y: 0, playerId: 'someone' }, { t: 'parry', x: 0, y: 0, playerId: 'p1' }]);
    expect(t.view.count('parries')).toBe(1);
    // a riposte that kills
    t.frame(w, null, c, [{ t: 'feat', kind: 'riposte', playerId: 'p1', targetId: 77 }, death(77, 'skeleton')]);
    expect(t.view.count('riposteKills')).toBe(1);
    t.frame(w, null, c, [{ t: 'feat', kind: 'revive', playerId: 'p1', targetId: 3 }]);
    expect(t.unlocked('revive')).toBe(true);
  });

  it('Thermos sips and weapons spoil the boss feats; fists and a clean zone count', () => {
    const { t, w, c } = setup();
    t.begin({ clean: true });
    w.zone = 1;
    w.bossId = 9;
    t.frame(w, null, c, []);
    c.flaskCur -= 1;
    t.frame(w, null, c, []);
    t.frame(w, null, c, [death(9, 'the_caretaker')]);
    expect(t.unlocked('boss_the_caretaker')).toBe(true);
    expect(t.unlocked('flaskless')).toBe(false);
    expect(t.unlocked('clean_zone')).toBe(true);
    // no weapon for the whole fight
    c.equipment.main = null;
    w.zone = 2;
    w.bossId = 11;
    t.frame(w, null, c, []);
    t.note({ k: 'death', by: 'mimic' });
    expect(t.unlocked('mimic_death')).toBe(true);
    expect(t.unlocked('die_1')).toBe(true);
    w.bossId = 12;
    t.frame(w, null, c, []);
    t.frame(w, null, c, [death(12, 'mother_spore')]);
    expect(t.unlocked('fists')).toBe(true);
    // died in zone 2: not clean
    expect(t.view.count('clean:2')).toBe(0);
  });

  it('polls the character: legendary, full set, a Tier 5 gem, Glowen, party size', () => {
    const { t, w, c } = setup();
    t.begin();
    // the Knight starts in a full zone-1 set: that is not finding one
    expect(wearsFullSet(c)).toBe(false);
    c.glowen = 10000;
    c.gems.push({ family: c.gems[0]?.family ?? 'quicksilver', tier: 5 });
    c.equipment.head = { id: 'h', baseId: 'mycelial_head', slot: 'head', kind: 'armor', rarity: 'common', ilvl: 1, name: 'h', affixes: [], sockets: [] };
    c.equipment.body = { id: 'b', baseId: 'mycelial_body', slot: 'body', kind: 'armor', rarity: 'common', ilvl: 1, name: 'b', affixes: [], sockets: [] };
    c.equipment.legs = { id: 'l', baseId: 'mycelial_legs', slot: 'legs', kind: 'armor', rarity: 'legendary', ilvl: 1, name: 'l', affixes: [], sockets: [] };
    for (let i = 0; i < 30; i++) t.frame(w, null, c, []);
    for (const id of ['glowen_10k', 'gem_max', 'full_set', 'legendary']) expect(t.unlocked(id)).toBe(true);
  });
});

describe('The Dark Shard', () => {
  it('unlocks with the last of the others, in the same call, and not before', () => {
    const { t } = setup();
    const others = ACHIEVEMENTS.filter((a) => a.id !== DARK_SHARD);
    // every counter the table reads, maxed, except the last one's
    const keys = [
      'kills', 'deaths', 'parries', 'riposteKills', 'level', 'glowen', 'party', 'encumberedS', 'credits', 'instructor', 'mimicKill',
      'mimicDeath', 'legendary', 'fullSet', 'gemMax', 'flaskless', 'fists', 'revive', 'gary', 'ng1', 'ng2',
      ...Object.keys(BOSSES).map((b) => `boss:${b}`),
      ...CLASS_IDS.map((c) => `class:${c}`),
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((z) => `clean:${z}`),
    ];
    for (const k of keys) t.max(k, 100000);
    expect(t.unlocked(DARK_SHARD)).toBe(false);
    expect(others.filter((a) => !t.unlocked(a.id)).map((a) => a.id)).toEqual(['gary_gone']);
    expect(ACHIEVEMENTS.find((a) => a.id === DARK_SHARD)!.progress!(t.view)).toEqual([others.length - 1, others.length]);
    const order: string[] = [];
    t.onUnlock((a) => order.push(a.id));
    t.note({ k: 'garyGone' });
    expect(order).toEqual(['gary_gone', DARK_SHARD]);
    expect(t.totals()).toEqual([ACHIEVEMENTS.length, ACHIEVEMENTS.length]);
  });
});
