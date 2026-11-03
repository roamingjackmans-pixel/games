// Statistics (GAME_DESIGN §21): the counter rules, the stored record, per-character and account totals, the
// counters fed from world events and the character, and the screen's derived lines.
import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../../src/engine/settings';
import { Rng } from '../../src/engine/rng';
import { STATS_KEY, StatsTracker, bump, legacyCounters, loadStats, peekSaveCounters } from '../../src/game/stats';
import { World, type Entity, type GameEvent } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { newSave, normalizeSave } from '../../src/game/save/schema';
import { fmtClock, fmtDistance, fmtDuration, headlines, topOf } from '../../src/ui/statistics';
import type { SaveFile } from '../../src/game/types';

function setup(seed: SaveFile[] = []): { t: StatsTracker; store: MemoryStore; w: World; save: SaveFile; me: Entity; tick: (ms?: number) => void } {
  const store = new MemoryStore();
  let clock = 1_700_000_000_000;
  const t = new StatsTracker(store, () => clock, () => seed);
  const w = new World('STATS', Room.empty());
  const save = newSave(1, newCharacter('knight', 'Joe', 'p1', new Rng('STATS')), 'STATS');
  const me = spawnPlayer(w, save.character, 0, true, 600, 368);
  w.refreshLists();
  return { t, store, w, save, me, tick: (ms = 16) => (clock += ms) };
}

const death = (id: number, defId: string, extra: Partial<Extract<GameEvent, { t: 'death' }>> = {}): GameEvent => ({ t: 'death', id, x: 0, y: 0, isPlayer: false, defId, ...extra });
const stat = (key: string, playerId = 'p1', n?: number): GameEvent => ({ t: 'stat', key, playerId, ...(n !== undefined ? { n } : {}) });

describe('counter rules', () => {
  it('adds plain keys, keeps the lowest best: and the highest most:', () => {
    const c: Record<string, number> = {};
    bump(c, 'kills', 2);
    bump(c, 'kills', 3);
    bump(c, 'kills', -4);
    bump(c, 'best:boss:x', 90);
    bump(c, 'best:boss:x', 120);
    bump(c, 'best:boss:x', 75);
    bump(c, 'most:hit', 40);
    bump(c, 'most:hit', 12);
    bump(c, 'kills', Number.NaN);
    expect(c).toEqual({ kills: 5, 'best:boss:x': 75, 'most:hit': 40 });
  });

  it('carries the old save counters over', () => {
    const save = newSave(1, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 'S');
    save.stats = { deaths: 3, kills: 40, bossKills: 1, playtimeSec: 600, elitesKilled: 2, mimicsKilled: 1, mimicDeaths: 1 };
    expect(legacyCounters(save.stats)).toEqual({ kills: 40, deaths: 3, bosses: 1, elites: 2, mimics: 1, mimicBites: 1, playtime: 600 });
    expect(peekSaveCounters(save).kills).toBe(40);
    expect(save.stats.extra).toBeUndefined();
  });
});

describe('stored record', () => {
  it('starts from the saves on the first run, then from its own record', () => {
    const old = newSave(2, newCharacter('brute', 'Bo', 'p2', new Rng(2)), 'S');
    old.stats.kills = 10;
    old.stats.deaths = 2;
    const { t, store } = setup([old, old]);
    expect(t.get('kills')).toBe(20);
    expect(t.get('deaths')).toBe(4);
    t.add('kills', 5);
    t.flush();
    const again = new StatsTracker(store, () => 0, () => [old]);
    expect(again.get('kills')).toBe(25);
  });

  it('survives a corrupt or odd record', () => {
    const s = new MemoryStore();
    expect(loadStats(s)).toBeNull();
    s.setItem(STATS_KEY, '{nope');
    expect(loadStats(s)!.c).toEqual({});
    s.setItem(STATS_KEY, JSON.stringify({ c: { kills: 4, bad: 'x', neg: -1, inf: null } }));
    expect(loadStats(s)!.c).toEqual({ kills: 4 });
  });

  it('a save keeps numbers only in its statistics', () => {
    const save = newSave(1, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 'S');
    (save.stats as { extra: unknown }).extra = { kills: 3, junk: 'x', nan: Number.NaN };
    expect(normalizeSave(save).stats.extra).toEqual({ kills: 3 });
  });
});

describe('counting a run', () => {
  it('counts for the character and the account at once', () => {
    const { t, w, save, me } = setup();
    const id = Object.keys(ENEMIES).find((k) => ENEMIES[k]!.zone === 1 && ENEMIES[k]!.role === 'fodder')!;
    t.frame(w, me, save, [death(50, id, { by: me.id }), death(51, id, { by: me.id, elite: 'frenzied' }), death(52, 'dummy_still')]);
    expect(t.get('kills')).toBe(2);
    expect(save.stats.extra!.kills).toBe(2);
    expect(save.stats.extra![`kill:${id}`]).toBe(2);
    expect(t.get('elites')).toBe(1);
    expect(t.get('affix:frenzied')).toBe(1);
    expect(t.get(`zoneKills:${w.zone}`)).toBe(2);
  });

  it("does not take another player's kills or hits", () => {
    const { t, w, save, me } = setup();
    const other = spawnPlayer(w, newCharacter('duelist', 'Ann', 'p2', new Rng(3)), 1, false, 500, 368);
    w.refreshLists();
    t.frame(w, me, save, [
      death(60, 'skeleton', { by: other.id }),
      death(61, 'skeleton', { by: me.id }),
      { t: 'dmg', x: 0, y: 0, amount: 30, type: 'physical', crit: true, toPlayer: false, targetId: 61, src: other.id },
      { t: 'dmg', x: 0, y: 0, amount: 12, type: 'physical', crit: false, toPlayer: false, targetId: 61, src: me.id, affinity: 'weak' },
    ]);
    expect(t.get('kills')).toBe(1);
    expect(t.get('dmgDealt')).toBe(12);
    expect(t.get('weakHits')).toBe(1);
    expect(t.get('crits')).toBe(0);
  });

  it('reads real combat: the kill and the hits carry their source', () => {
    const { t, w, save, me } = setup();
    const def = Object.values(ENEMIES).find((d) => d.zone === 1 && d.role === 'fodder')!;
    const e = spawnEnemy(w, def, 640, 368, { tellS: 0 });
    e.en!.state = 'idle';
    hitEnemy(w, me, e, { ...emptySpec('player'), dmg: { physical: 99999 } }, me.x, me.y);
    t.frame(w, me, save, w.events);
    expect(t.get('kills')).toBe(1);
    expect(t.get(`kill:${def.id}`)).toBe(1);
    expect(t.get('dmgDealt')).toBeGreaterThan(0);
    expect(t.get('most:hit')).toBeGreaterThan(0);
  });

  it('counts damage taken, the killer and the shards left on the floor', () => {
    const { t, w, save, me, tick } = setup();
    const def = Object.values(ENEMIES).find((d) => d.zone === 1 && d.role === 'fodder')!;
    const e = spawnEnemy(w, def, 640, 368, { tellS: 0 });
    save.character.shards = 0;
    t.frame(w, me, save, []);
    save.character.shards = 500;
    tick();
    t.frame(w, me, save, [{ t: 'dmg', x: 0, y: 0, amount: 25, type: 'physical', crit: false, toPlayer: true, targetId: me.id, src: e.id }]);
    expect(t.get('shardsGained')).toBe(500);
    expect(t.get('dmgTaken')).toBe(25);
    t.note({ k: 'death' });
    save.character.shards = 0;
    tick();
    t.frame(w, me, save, []);
    expect(t.get('deaths')).toBe(1);
    expect(t.get(`deathBy:${def.id}`)).toBe(1);
    expect(t.get('shardsDropped')).toBe(500);
    expect(t.get('shardsSpent')).toBe(0);
    // walking back to the pile: recovered, not gained
    save.character.shards = 500;
    tick();
    t.frame(w, me, save, [stat('shardsRecovered', 'p1', 500)]);
    expect(t.get('shardsRecovered')).toBe(500);
    expect(t.get('shardsGained')).toBe(500);
    expect(headlines(t.rec.c)[2]!.value).toBe('0');
  });

  it('spending shards and Glowen, levels, Thermos sips and NG+', () => {
    const { t, w, save, me, tick } = setup();
    const c = save.character;
    c.shards = 1000;
    c.glowen = 100;
    c.flaskCur = 3;
    t.frame(w, me, save, []);
    c.shards = 400;
    c.level += 2;
    c.glowen = 160;
    c.flaskCur = 2;
    tick();
    t.frame(w, me, save, []);
    c.glowen = 10;
    c.cycle = 1;
    tick();
    t.frame(w, me, save, []);
    expect(t.get('shardsSpent')).toBe(600);
    expect(t.get('levels')).toBe(2);
    expect(t.get('glowenEarned')).toBe(60);
    expect(t.get('glowenSpent')).toBe(150);
    expect(t.get('sips')).toBe(1);
    expect(t.get('cycles')).toBe(1);
    expect(t.get('most:shards')).toBe(1000);
  });

  it('stat events: only mine or the party’s', () => {
    const { t, w, save, me } = setup();
    t.frame(w, me, save, [stat('dodges'), stat('dodges'), stat('dodges', 'p2'), stat('roomsCleared', ''), stat('blocks'), stat('falls'), stat('chests'), stat('mimicBites')]);
    expect(t.get('dodges')).toBe(2);
    expect(t.get('roomsCleared')).toBe(1);
    expect(t.get('blocks') + t.get('falls') + t.get('chests') + t.get('mimicBites')).toBe(4);
  });

  it('parries, ripostes, revives, downs and loot', () => {
    const { t, w, save, me } = setup();
    t.frame(w, me, save, [
      { t: 'parry', x: 0, y: 0, playerId: 'p1' },
      { t: 'feat', kind: 'riposte', playerId: 'p1', targetId: 4 },
      { t: 'feat', kind: 'revive', playerId: 'p1', targetId: 5 },
      { t: 'revived', playerId: 'p1' },
      { t: 'downed', playerId: 'p1' },
      { t: 'loot', playerId: 'p1', rarity: 'legendary', x: 0, y: 0 },
      { t: 'loot', playerId: 'p2', rarity: 'rare', x: 0, y: 0 },
    ]);
    expect([t.get('parries'), t.get('ripostes'), t.get('revivesGiven'), t.get('revivesReceived'), t.get('downed')]).toEqual([1, 1, 1, 1, 1]);
    expect(t.get('loot:legendary')).toBe(1);
    expect(t.get('loot:rare')).toBe(0);
  });

  it('times a boss from the end of its intro, once per kill', () => {
    const { t, w, save, me, tick } = setup();
    const def = Object.values(BOSSES)[0]!;
    const b = spawnEnemy(w, def, 700, 368, { tellS: 0 });
    b.en!.state = 'idle';
    w.bossId = b.id;
    t.frame(w, me, save, []);
    for (let i = 0; i < 300; i++) {
      tick(200);
      t.frame(w, me, save, []);
    }
    t.frame(w, me, save, [death(b.id, def.id, { by: me.id }), death(b.id + 1, def.id)]);
    expect(t.get('bosses')).toBe(1);
    expect(t.get(`boss:${def.id}`)).toBe(1);
    expect(t.get(`best:boss:${def.id}`)).toBe(60);
  });

  it('walks, plays and enters rooms; a teleport is not a walk', () => {
    const { t, w, save, me, tick } = setup();
    t.frame(w, me, save, []);
    for (let i = 0; i < 10; i++) {
      me.x += 3;
      tick(100);
      t.frame(w, me, save, []);
    }
    me.x += 500;
    tick(100);
    t.frame(w, me, save, []);
    w.room = Room.empty();
    t.frame(w, me, save, []);
    expect(t.get('distance')).toBeCloseTo(30, 5);
    expect(t.get('playtime')).toBeCloseTo(1.1, 5);
    expect(t.get('rooms')).toBe(1);
    w.paused = true;
    tick(100);
    t.frame(w, me, save, []);
    expect(t.get('playtime')).toBeCloseTo(1.1, 5);
  });

  it('inventory actions count only when they went through', () => {
    const { t, w, save, me } = setup();
    t.frame(w, me, save, []);
    t.count({ ok: true, msg: '' }, 'gemsUpgraded');
    t.count({ ok: false, msg: '' }, 'gemsUpgraded');
    t.count({ ok: true, msg: '' }, { garyBuys: 1, garyGlowen: 250 });
    expect(t.get('gemsUpgraded')).toBe(1);
    expect(save.stats.extra!.garyGlowen).toBe(250);
  });
});

describe('screen helpers', () => {
  it('formats and picks the headline numbers', () => {
    expect(fmtDuration(59)).toBe('59s');
    expect(fmtDuration(3725)).toBe('1h 2m');
    expect(fmtClock(75)).toBe('1:15');
    expect(fmtDistance(32 * 830)).toBe('830 m');
    expect(fmtDistance(32 * 12400)).toBe('12.4 km');
    const c = { 'kill:skeleton': 12, 'kill:rat': 40, 'deathBy:skeleton': 3, kills: 52, deaths: 4, shardsDropped: 1000, shardsRecovered: 250, 'affix:molten': 2 };
    expect(topOf(c, 'kill:')).toEqual(['rat', 40]);
    const hl = headlines(c);
    expect(hl.map((x) => x.label)).toContain('Most hated enemy');
    expect(hl[2]!.value).toBe('750');
    expect(hl[3]!.value).toBe('Molten');
    expect(hl[4]!.value).toBe('13.0');
  });
});
