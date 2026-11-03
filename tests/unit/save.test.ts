import { describe, expect, it } from 'vitest';
import { newSave, validateSave, SAVE_VERSION } from '../../src/game/save/schema';
import { migrate } from '../../src/game/save/migrations';
import { parseImport, exportText } from '../../src/game/save/exportImport';
import { readSave, writeSave, listSaves, deleteSave } from '../../src/game/save/storage';
import { MemoryStore } from '../../src/engine/settings';
import { newCharacter } from '../../src/game/player/character';
import { CLASS_IDS, CLASSES } from '../../src/data/classes';
import { Rng } from '../../src/engine/rng';
import { defaultGamepad, defaultKeyboard, deserializeBindings, findConflicts, rebind, serializeBindings } from '../../src/engine/input/bindings';

/** A version-0 save from before leftBehind / altMain / freePoints existed. */
const V0_FIXTURE = {
  version: 0,
  slot: 4,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  character: {
    playerId: 'old-joe',
    name: 'Old Joe',
    classId: 'brute',
    level: 3,
    stats: { hp: 13, stamina: 8, bonk: 15, slicey: 5, brain: 4, prayer: 5 },
    shards: 12,
    stardust: 3,
    flaskMax: 1,
    flaskCur: 1,
    bossesBeaten: 0,
    highestZoneBeaten: 0,
    cycle: 0,
    equipment: { main: null, off: null, head: null, body: null, legs: null, ring1: null, ring2: null },
    twoHanded: true,
    bag: [],
    gems: [],
    consumables: { throwing_knife: 3 },
    knownSpells: [],
    spellLoadout: { brain: [null, null, null], prayer: [null, null, null] },
    tears: 0,
  },
  world: {
    seed: 'OLDSEED',
    zone: 1,
    roomId: 'z1-start',
    respawnBonfireId: 'z1-start',
    bonfiresUsed: [],
    bonfiresUsedByPlayer: {},
    roomsCleared: [],
    chestsOpened: [],
    mimicsKilled: [],
    mimicsAwake: [],
    reliquariesOpened: [],
    bossesBeatenThisCycle: [],
    garyGone: false,
    garyStock: {},
    shopStock: {},
  },
  stats: { deaths: 1, kills: 4, bossKills: 0, playtimeSec: 60, elitesKilled: 0, mimicsKilled: 0, mimicDeaths: 0 },
};

describe('save schema (DATA_MODEL §1)', () => {
  it('a new save of every class validates', () => {
    for (const id of CLASS_IDS) {
      const s = newSave(1, newCharacter(id, 'Joe', 'p', new Rng(id)), 'SEED');
      expect(validateSave(s), id).toEqual([]);
      expect(s.character.stats).toEqual(CLASSES[id].stats);
    }
  });
  it('rejects broken or newer saves', () => {
    expect(validateSave(null).length).toBeGreaterThan(0);
    expect(validateSave({ version: 1 }).length).toBeGreaterThan(0);
    const s = newSave(1, newCharacter('knight', 'Joe', 'p'), 'SEED');
    expect(validateSave({ ...s, version: SAVE_VERSION + 1 })[0]).toContain('newer');
    const bad = JSON.parse(JSON.stringify(s));
    bad.character.classId = 'wizard';
    expect(validateSave(bad)).toContain('unknown class');
  });
  it('migrates a version-0 fixture', () => {
    const m = migrate(JSON.parse(JSON.stringify(V0_FIXTURE))) as Record<string, unknown>;
    expect(m.version).toBe(SAVE_VERSION);
    expect(validateSave(m)).toEqual([]);
    const mc = m.character as { glowen: number; stats: Record<string, number> };
    expect(mc.glowen).toBe(3);
    expect(mc.stats.endurance).toBe(8);
    expect(mc.stats.stamina).toBeUndefined();
    const s = parseImport(JSON.stringify(V0_FIXTURE), 7);
    if (typeof s === 'string') throw new Error(s);
    expect(s.slot).toBe(7);
    expect(s.character.altMain).toBeNull();
    expect(s.character.freePoints).toBe(0);
    expect(s.world.leftBehind).toEqual({});
  });
});

describe('export / import', () => {
  it('export → import restores a character into a different slot', () => {
    const c = newCharacter('cleric', 'Exported Joe', 'pid', new Rng(3));
    c.level = 9;
    c.shards = 1234;
    const s = newSave(2, c, 'EXPORTSEED');
    const text = exportText(s);
    const back = parseImport(text, 9);
    if (typeof back === 'string') throw new Error(back);
    expect(back.slot).toBe(9);
    expect(back.character).toEqual(s.character);
    expect(back.world.seed).toBe('EXPORTSEED');
    const store = new MemoryStore();
    writeSave(store, back);
    expect(readSave(store, 9)!.character.name).toBe('Exported Joe');
    expect(listSaves(store).filter(Boolean).length).toBe(1);
    deleteSave(store, 9);
    expect(readSave(store, 9)).toBeNull();
  });
  it('import refuses bad files', () => {
    expect(parseImport('not json', 1)).toContain('not valid JSON');
    expect(parseImport('{"hello":1}', 1)).toContain('Not a Dungeon Joe save');
    const s = newSave(1, newCharacter('knight', 'Joe', 'p'), 'SEED');
    expect(parseImport(JSON.stringify({ ...s, version: 99 }), 1)).toContain('newer');
  });
});

describe('bindings round-trip and conflicts (D34)', () => {
  it('rebinding then serialising keeps the change and stays conflict-free', () => {
    const kb = defaultKeyboard();
    const pad = defaultGamepad();
    rebind(kb, 'flask', 'KeyV');
    rebind(pad, 'dodge', 2); // X: was the flask
    expect(pad.flask).toEqual([]);
    const back = deserializeBindings(serializeBindings(kb, pad));
    expect(back.keyboard.flask).toEqual(['KeyV']);
    expect(back.gamepad.dodge).toEqual([2]);
    expect(findConflicts(back.keyboard)).toEqual([]);
    expect(findConflicts(back.gamepad)).toEqual([]);
  });
});
