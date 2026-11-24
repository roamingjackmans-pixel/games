// FlashGames mode (D452, GAME_DESIGN §25): the ?flash= payload, public/flash.json against the game's modifiers, each
// modifier doing what it says, every allowed pair and triple running, and a score that never goes down.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FLASH_MODIFIERS, FLASH_MODIFIER_BY_ID, SPELLS_ONLY_POOL } from '../../src/flash/modifiers';
import { applyFlashRun, flashWorldSeed, knownMods, planFlashRun, type FlashSetup } from '../../src/flash/setup';
import { FLASH_POINTS, FlashScore } from '../../src/flash/score';
import { FlashController, type FlashApi } from '../../src/flash/controller';
import { neutralRunMods, runMods, setRunMods } from '../../src/game/runMods';
import { GameSession } from '../../src/game/session';
import { stepWorld } from '../../src/game/sim';
import { rawDamage } from '../../src/game/combat/damage';
import { flaskCap } from '../../src/game/combat/formulas';
import { computeDerived } from '../../src/game/player/derived';
import * as playerMod from '../../src/game/player/player';
import { modRoomPlan, bossRushRooms } from '../../src/game/procgen/modPlan';
import { planRoom } from '../../src/game/procgen/waves';
import { canBeElite } from '../../src/game/procgen/elite';
import { bonusBossPool } from '../../src/game/procgen/bonusBoss';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { startEnemyAttack } from '../../src/game/enemies/attacks';
import { enemyDrops } from '../../src/game/items/drops';
import { equip } from '../../src/game/items/inventory';
import { makeItem } from '../../src/game/items/make';
import { itemRequirements, meetsRequirements } from '../../src/game/items/bases';
import { ACTION_BIT, emptyInput } from '../../src/engine/input/actions';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { MemoryStore, ReadThroughStore, getStore, useStore } from '../../src/engine/settings';
import { inCombat } from './inCombat';
import type { Entity } from '../../src/game/world';

interface FlashJson {
  v: number;
  id: string;
  name: string;
  tagline: string;
  goal: string;
  scoring: string;
  maxScore: number;
  pick: [number, number];
  modifiers: { id: string; name: string; text: string; excludes?: string[]; weight?: number }[];
}
const JSON_FILE = JSON.parse(readFileSync(new URL('../../public/flash.json', import.meta.url), 'utf8')) as FlashJson;

/** A seeded stand-in for FlashRun.rng (mulberry32, as the SDK). */
function rngOf(seed: number): (salt: string) => () => number {
  return (salt) => {
    let h = 2166136261 >>> 0;
    for (const ch of salt) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    let a = (seed ^ h) >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
}

function plan(mods: string[], seed = 4242): FlashSetup {
  const s = planFlashRun({ seed, mods, rng: rngOf(seed) });
  applyFlashRun(s);
  return s;
}

function startSession(s: FlashSetup): GameSession {
  const g = new GameSession(s.save);
  g.start();
  return g;
}

function step(g: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(g.w);
}

/** The zone's combat and ambush rooms nearest the start first (Boss Rush Hour's count). */
function fightRooms(g: GameSession): string[] {
  return g.layout.rooms.filter((r) => r.kind === 'combat' || r.kind === 'ambush').sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id)).map((r) => r.id);
}

/** Walk into a fight room and knock everything down as it comes, until the room is won (or the time runs out). */
function fight(g: GameSession, roomId: string, maxSec = 40): void {
  g.enterRoom(roomId, 'n');
  g.w.god = true;
  const p = g.localPlayer!;
  p.x = 640;
  p.y = 380;
  for (let t = 0; t < maxSec && g.roomPhase !== 'cleared'; t += 0.5) {
    step(g, 0.5);
    for (const e of [...g.w.enemies]) if (!e.hp!.dead && !e.en!.def.special && e.en!.state !== 'spawning') rawDamage(g.w, e, 1e12, 'holy', p.id);
  }
  g.w.god = false;
}

afterEach(() => {
  setRunMods(null);
  useStore(null);
});

// ------------------------------------------------------------------ the payload and flash.json

describe('FlashGames: the ?flash= payload (the SDK, copied unchanged)', () => {
  it('reads seed, modifiers and limit; no ?flash= leaves it off', async () => {
    const payload = { v: 1, date: '2026-11-24', seed: 12345, mods: ['glass', 'turbo'], limit: 120, run: 'test' };
    const code = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const g = globalThis as unknown as Record<string, unknown>;
    const had = { location: g.location, addEventListener: g.addEventListener, FlashRun: g.FlashRun };
    try {
      g.addEventListener = () => undefined;
      g.location = { search: `?flash=${code}` };
      vi.resetModules();
      await import('../../src/flash/flash-run.js');
      const fr = g.FlashRun as FlashRunApi;
      expect(fr.active).toBe(true);
      expect(fr.seed).toBe(12345);
      expect(fr.mods).toEqual(['glass', 'turbo']);
      expect(fr.limit).toBe(120);
      expect(fr.has('glass')).toBe(true);
      expect(fr.has('dark')).toBe(false);
      // the same salt gives everyone the same stream
      expect(fr.rng('class')()).toBe(fr.rng('class')());
      // and the run it plans is the same for everyone
      const a = planFlashRun({ seed: fr.seed, mods: fr.mods, rng: (s) => fr.rng(s) });
      const b = planFlashRun({ seed: fr.seed, mods: fr.mods, rng: (s) => fr.rng(s) });
      expect(a.classId).toBe(b.classId);
      expect(a.save.world.seed).toBe(flashWorldSeed(12345));
      expect(JSON.stringify(a.save.character)).toBe(JSON.stringify(b.save.character));
      g.location = { search: '?seed=x' };
      vi.resetModules();
      await import('../../src/flash/flash-run.js');
      expect((g.FlashRun as FlashRunApi).active).toBe(false);
      g.location = { search: '?flash=not-json' };
      vi.resetModules();
      await import('../../src/flash/flash-run.js');
      expect((g.FlashRun as FlashRunApi).active).toBe(false);
    } finally {
      Object.assign(g, had);
    }
  });

  it('ignores modifiers it does not know and repeats', () => {
    const k = knownMods(['glass', 'nope', 'glass', 'dark']);
    expect(k.active.map((m) => m.id)).toEqual(['glass', 'dark']);
    expect(k.unknown).toEqual(['nope']);
    const s = planFlashRun({ seed: 1, mods: ['nope'], rng: rngOf(1) });
    expect(s.active).toEqual([]);
    expect(s.mods).toEqual(neutralRunMods());
  });

  it('public/flash.json follows the protocol and matches the game exactly', () => {
    const j = JSON_FILE;
    expect(j.v).toBe(1);
    expect(j.id).toBe('dungeonjoe');
    for (const k of ['name', 'tagline', 'goal', 'scoring'] as const) expect(j[k].length).toBeGreaterThan(5);
    expect(j.maxScore).toBeGreaterThan(0);
    expect(j.pick[0]).toBeGreaterThanOrEqual(1);
    expect(j.pick[1]).toBeGreaterThanOrEqual(j.pick[0]);
    expect(j.modifiers.length).toBeGreaterThanOrEqual(12);
    expect(j.modifiers.length).toBeLessThanOrEqual(16);
    const ids = j.modifiers.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    // the game's own list, field for field
    expect(j.modifiers).toEqual(FLASH_MODIFIERS.map((m) => ({ id: m.id, name: m.name, text: m.text, ...(m.excludes ? { excludes: m.excludes } : {}), ...(m.weight ? { weight: m.weight } : {}) })));
    for (const m of j.modifiers) {
      for (const x of m.excludes ?? []) {
        expect(ids).toContain(x);
        // both sides say it
        expect(FLASH_MODIFIER_BY_ID[x]!.excludes ?? []).toContain(m.id);
      }
      // every modifier does something
      const d = FLASH_MODIFIER_BY_ID[m.id]!;
      expect(!!(d.mods || d.kit || d.stats || d.rules)).toBe(true);
    }
  });
});

// ------------------------------------------------------------------ each modifier

describe('FlashGames: the run itself', () => {
  it('skips the tutorial, starts at zone 1 with a seeded class, and never writes the browser', () => {
    const s = plan([]);
    expect(s.save.character.tutorialDone).toBe(true);
    expect(s.save.slot).toBe(0);
    const g = startSession(s);
    expect(g.node.id).toBe('z1-start');
    expect(planFlashRun({ seed: 4242, mods: [], rng: rngOf(4242) }).classId).toBe(s.classId);
    // classes differ from day to day
    const classes = new Set(Array.from({ length: 40 }, (_, i) => planFlashRun({ seed: i, mods: [], rng: rngOf(i) }).classId));
    expect(classes.size).toBeGreaterThan(5);
    // the store: reads settings from the browser, never writes it
    const disk = new MemoryStore();
    disk.setItem('dj.settings', '{"audio":{"master":0.3}}');
    disk.setItem('dj.save.3', 'mine');
    useStore(new ReadThroughStore(disk, (k) => k === 'dj.settings'));
    const st = getStore();
    expect(st.getItem('dj.settings')).toBe('{"audio":{"master":0.3}}');
    expect(st.getItem('dj.save.3')).toBeNull();
    st.setItem('dj.settings', 'changed');
    st.setItem('dj.save.0', 'run');
    st.removeItem('dj.save.3');
    expect(st.getItem('dj.settings')).toBe('changed');
    expect(disk.keys().sort()).toEqual(['dj.save.3', 'dj.settings']);
    expect(disk.getItem('dj.settings')).toBe('{"audio":{"master":0.3}}');
    expect(disk.getItem('dj.save.3')).toBe('mine');
  });

  it('glass: 1 max HP and every stat at 999', () => {
    const s = plan(['glass']);
    expect(Object.values(s.save.character.stats).every((v) => v === 999)).toBe(true);
    expect(computeDerived(s.save.character).maxHp).toBe(1);
    expect(startSession(s).localPlayer!.hp!.max).toBe(1);
  });

  it('turbo: two sim steps an update', () => {
    expect(plan(['turbo']).rules.steps).toBe(2);
    expect(plan([]).rules.steps).toBe(1);
  });

  it('mimics: every chest is a mimic and every fight room has one', () => {
    const g = startSession(plan(['mimics']));
    for (const id of fightRooms(g).slice(0, 4)) {
      g.enterRoom(id, 'n');
      step(g, 0.2);
      const mimics = g.w.enemies.filter((e) => e.en!.def.traits?.mimic);
      expect(mimics.length).toBe(1);
      expect(mimics[0]!.en!.state).toBe('dormant');
      expect([...g.w.entities.values()].some((e) => e.it?.kind === 'chest')).toBe(false);
    }
    const treasure = g.layout.rooms.find((r) => r.kind === 'treasure');
    if (treasure) {
      g.enterRoom(treasure.id, 'n');
      expect([...g.w.entities.values()].some((e) => e.it?.kind === 'chest')).toBe(false);
      expect(g.w.enemies.some((e) => e.en!.def.traits?.mimic)).toBe(true);
    }
  });

  it('elites: every enemy that can be an Elite is one', () => {
    const g = startSession(plan(['elites']));
    for (const id of fightRooms(g).slice(0, 5)) {
      const p = modRoomPlan(planRoom(g.layout, g.layout.byId[id]!), g.layout, g.layout.byId[id]!);
      for (const u of p.waves.flat()) expect(!!u.elite).toBe(canBeElite(ENEMIES[u.defId]));
    }
    fight(g, fightRooms(g)[0]!);
    expect(g.save.stats.elitesKilled).toBeGreaterThan(0);
  });

  it('horde: 1 HP enemies, three times the waves; bosses keep their HP', () => {
    const g = startSession(plan(['horde']));
    const node = g.layout.byId[fightRooms(g)[0]!]!;
    setRunMods(null);
    const base = planRoom(g.layout, node);
    applyFlashRun(plan(['horde']));
    const p = modRoomPlan(base, g.layout, node);
    expect(p.waves.length).toBe(base.waves.length * 3);
    expect(p.share).toBeCloseTo((base.share ?? 1.5) * 3);
    const def = ENEMIES[base.waves[0]![0]!.defId]!;
    const e = spawnEnemy(g.w, def, 300, 300, { zone: 1 });
    expect(e.hp!.max).toBe(1);
    const elite = spawnEnemy(g.w, def, 320, 300, { zone: 1, elite: 'armored' });
    expect(elite.hp!.max).toBe(1);
    const boss = spawnEnemy(g.w, BOSSES.the_caretaker!, 600, 300, { zone: 1 });
    expect(boss.hp!.max).toBeGreaterThan(100);
  });

  it('bottomless: a drink uses no charge; dry: no Thermos at all', () => {
    for (const id of ['bottomless', 'dry'] as const) {
      const s = plan([id]);
      const g = startSession(s);
      const c = s.save.character;
      const p = g.localPlayer!;
      inCombat(g.w);
      step(g, 0.5);
      p.hp!.hp = Math.ceil(p.hp!.max / 2);
      p.pl!.input = { ...emptyInput(), buttons: ACTION_BIT.flask, pressed: ACTION_BIT.flask };
      stepWorld(g.w);
      p.pl!.input = emptyInput();
      step(g, 2);
      if (id === 'bottomless') {
        expect(c.flaskCur).toBe(1);
        expect(p.hp!.hp).toBeGreaterThan(Math.ceil(p.hp!.max / 2));
      } else {
        expect(flaskCap(c)).toBe(0);
        expect(c.flaskCur).toBe(0);
        expect(p.hp!.hp).toBe(Math.ceil(p.hp!.max / 2));
        // a rest and a death bring none back
        const b = [...g.w.entities.values()].find((e) => e.it?.kind === 'bonfire')!;
        g.interact(p, b);
        expect(c.flaskCur).toBe(0);
        rawDamage(g.w, p, 1e9, 'physical', 0);
        g.respawn();
        expect(c.flaskCur).toBe(0);
      }
    }
  });

  it('crimson: plain attacks turn Red; Piercing ones stay Piercing', () => {
    const g = startSession(plan(['crimson']));
    const def = Object.values(ENEMIES).find((d) => d.attacks.some((a) => a.kind === 'normal') && d.attacks.some((a) => a.kind === 'pierce') && !d.special)!;
    const e = spawnEnemy(g.w, def, 500, 380, { zone: 1, tellS: 0 });
    const normal = def.attacks.find((a) => a.kind === 'normal')!;
    startEnemyAttack(g.w, e, normal, g.localPlayer);
    expect(e.en!.attack!.def.kind).toBe('red');
    expect(normal.kind).toBe('normal');
    const pierce = def.attacks.find((a) => a.kind === 'pierce')!;
    startEnemyAttack(g.w, e, pierce, g.localPlayer);
    expect(e.en!.attack!.def.kind).toBe('pierce');
  });

  it('pinata: every kill drops an item', () => {
    const g = startSession(plan(['pinata']));
    const def = ENEMIES[g.layout.mix[0]!]!;
    const ctx = { w: g.w, seed: g.save.world.seed, zone: 1, cycle: 0, cycleFor: () => 0 };
    for (let i = 0; i < 12; i++) {
      const e = spawnEnemy(g.w, def, 300 + i * 20, 300, { zone: 1, share: 1.5 });
      const before = [...g.w.entities.values()].filter((x) => x.type === 'pickup' && x.pk?.kind === 'item').length;
      enemyDrops(ctx, e);
      const after = [...g.w.entities.values()].filter((x) => x.type === 'pickup' && x.pk?.kind === 'item').length;
      expect(after).toBe(before + 1);
    }
  });

  it('tiny and huge: size, hit circle, HP, reach', () => {
    setRunMods(null);
    const plain = computeDerived(plan([]).save.character);
    setRunMods(null);
    expect(playerMod.PLAYER_DOT_R).toBe(17);
    const t = plan(['tiny']);
    const tinyHp = computeDerived(t.save.character).maxHp;
    const tp = startSession(t).localPlayer!;
    expect(playerMod.PLAYER_DOT_R).toBeLessThan(10);
    expect(playerMod.hitCircleOf(tp).r).toBe(playerMod.PLAYER_DOT_R);
    expect(tp.radius).toBeLessThan(playerMod.PLAYER_RADIUS);
    const h = plan(['huge']);
    const hugeHp = computeDerived(h.save.character).maxHp;
    const hp = startSession(h).localPlayer!;
    expect(playerMod.PLAYER_DOT_R).toBeGreaterThan(25);
    expect(hp.radius).toBeGreaterThan(playerMod.PLAYER_RADIUS);
    expect(runMods().playerReach).toBeGreaterThan(1);
    // same class and stats (the seed), so the HP and walk differ by the modifier alone
    expect(tinyHp).toBeLessThan(plain.maxHp);
    expect(hugeHp).toBeGreaterThan(plain.maxHp);
    setRunMods(null);
    expect(playerMod.PLAYER_DOT_R).toBe(17);
  });

  it('wildcard: a Legendary weapon with its first skill, and the stats to use it', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const s = plan(['wildcard'], seed);
      const c = s.save.character;
      const w = c.equipment.main!;
      expect(w.kind).toBe('weapon');
      expect(w.rarity).toBe('legendary');
      expect(w.skills).toBeGreaterThanOrEqual(1);
      expect(meetsRequirements(itemRequirements(w), c.stats, c.twoHanded)).toBe(true);
      expect(computeDerived(c).weaponMeetsReq).toBe(true);
      seen.add(w.baseId);
    }
    expect(seen.size).toBeGreaterThan(4);
  });

  it('spells: a staff, a talisman, six spells; weapons refused; half cooldowns', () => {
    const s = plan(['spells']);
    const c = s.save.character;
    expect(c.equipment.main!.baseId).toBe('arcane_staff');
    expect(c.equipment.off!.baseId).toBe('silver_talisman');
    expect(c.knownSpells.length).toBe(6);
    expect(c.spellLoadout.brain.filter(Boolean).length).toBe(3);
    expect(c.spellLoadout.prayer.filter(Boolean).length).toBe(3);
    expect(c.spellLoadout.brain).toContain(SPELLS_ONLY_POOL.brain.always[0]);
    expect([...c.bag, c.altMain].some((i) => i?.kind === 'weapon')).toBe(false);
    const d = computeDerived(c);
    expect(d.toolMeetsReq).toBe(true);
    const sw = makeItem('longsword', 'common', 1);
    c.bag.push(sw);
    expect(equip(c, sw.id).ok).toBe(false);
    expect(c.equipment.main!.baseId).toBe('arcane_staff');
    expect(runMods().spellCooldownMult).toBe(0.5);
  });

  it('bossy: every third fight room holds a challenger boss from another zone', () => {
    const g = startSession(plan(['bossy']));
    const rooms = fightRooms(g);
    const rush = bossRushRooms(g.layout, 3);
    expect([...rush]).toEqual(rooms.filter((_, i) => i % 3 === 2));
    const id = rooms[2]!;
    const p = modRoomPlan(planRoom(g.layout, g.layout.byId[id]!), g.layout, g.layout.byId[id]!);
    expect(bonusBossPool(1).map((b) => b.id)).toContain(p.bonusBoss);
    g.enterRoom(id, 'n');
    g.w.god = true;
    g.localPlayer!.x = 640;
    g.localPlayer!.y = 380;
    step(g, 1);
    const boss = g.w.enemies.find((e) => e.en!.bonusBoss);
    expect(boss).toBeTruthy();
    expect(boss!.en!.phase).toBe(1);
    fight(g, id);
    expect(g.roomPhase).toBe('cleared');
  });

  it('onelife: a death ends the run (dead); otherwise Joe gets up at the bonfire', () => {
    for (const one of [true, false]) {
      const s = plan(one ? ['onelife'] : []);
      const g = startSession(s);
      const calls: string[] = [];
      const api: FlashApi = { score: () => undefined, over: (_n, _d, r) => calls.push(r ?? ''), timeLeft: () => 60000 };
      const ctl = new FlashController(s, api);
      ctl.attach(g);
      ctl.go();
      ctl.died();
      expect(ctl.phase).toBe(one ? 'over' : 'running');
      expect(calls).toEqual(one ? ['dead'] : []);
    }
    expect(plan(['dark']).rules.dark).toBe(true);
  });
});

// ------------------------------------------------------------------ the score

describe('FlashGames: the score', () => {
  it('pays for depth and speed, by the zone', () => {
    const sc = new FlashScore();
    sc.kill('plain', 1);
    sc.kill('elite', 1);
    sc.roomCleared(1, 'z1-r1');
    sc.roomCleared(1, 'z1-r1');
    sc.kill('challenger', 1, 'z1-r2');
    sc.kill('challenger', 1, 'z1-r2');
    sc.kill('boss', 1);
    sc.reached(3);
    sc.kill('plain', 3);
    const p = FLASH_POINTS;
    expect(sc.points).toBe(p.kill + p.elite + p.room + p.challenger + p.elite + p.boss + p.zone * 2 + p.zone * 3 + p.kill * 3);
    expect(sc.zone).toBe(3);
    expect(sc.detail()).toBe('Zone 3 · 1 room · 6 kills · 2 Elites · 1 challenger · 1 boss');
    expect(sc.detail().length).toBeLessThanOrEqual(120);
  });

  it('never goes down, whatever happens (a random run of events)', () => {
    let seed = 7;
    const r = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const sc = new FlashScore();
    let last = 0;
    for (let i = 0; i < 5000; i++) {
      const k = Math.floor(r() * 6);
      const z = 1 + Math.floor(r() * 8);
      if (k === 0) sc.kill('plain', z);
      else if (k === 1) sc.kill(r() < 0.5 ? 'elite' : 'challenger', z, `r${Math.floor(r() * 9)}`);
      else if (k === 2) sc.roomCleared(z, `r${Math.floor(r() * 20)}`);
      else if (k === 3) sc.reached(z);
      else if (k === 4) sc.died();
      else sc.kill('boss', z);
      expect(sc.points).toBeGreaterThanOrEqual(last);
      last = sc.points;
    }
    expect(sc.points).toBeLessThan(JSON_FILE.maxScore);
  });

  it('a played run reports a score that only rises, through fights, a rest, a death and the end', () => {
    const s = plan(['horde', 'bossy'], 99);
    const g = startSession(s);
    const sent: number[] = [];
    let overWith: [number, string] | null = null;
    const api: FlashApi = {
      score: (n) => sent.push(n),
      over: (n, _d, r) => {
        overWith = [n, r ?? ''];
      },
      timeLeft: () => 0,
    };
    const ctl = new FlashController(s, api);
    ctl.attach(g);
    ctl.go();
    const rooms = fightRooms(g);
    for (const id of rooms.slice(0, 3)) {
      fight(g, id);
      ctl.frame();
    }
    expect(ctl.score.roomsCleared).toBeGreaterThanOrEqual(2);
    expect(ctl.score.challengers).toBe(1);
    // a rest respawns the rooms: fighting one again pays its kills, not the room a second time
    const rooms0 = ctl.score.roomsCleared;
    g.enterRoom(g.layout.startId, 'bonfire');
    const b = [...g.w.entities.values()].find((e) => e.it?.kind === 'bonfire')!;
    g.interact(g.localPlayer!, b);
    fight(g, rooms[0]!);
    ctl.frame();
    expect(ctl.score.roomsCleared).toBe(rooms0);
    // a death costs nothing but time
    const before = ctl.score.points;
    inCombat(g.w);
    rawDamage(g.w, g.localPlayer!, 1e9, 'physical', 0);
    ctl.died();
    g.respawn();
    ctl.frame();
    expect(ctl.score.points).toBe(before);
    expect(ctl.score.deaths).toBe(1);
    // the zone's boss and the next zone
    g.gotoZone(2);
    ctl.frame();
    expect(ctl.score.zone).toBe(2);
    ctl.end();
    expect(overWith).toEqual([ctl.score.points, 'time']);
    // after the end nothing more counts
    const final = ctl.score.points;
    fight(g, fightRooms(g)[0]!, 6);
    expect(ctl.score.points).toBe(final);
    expect(sent.length).toBeGreaterThan(3);
    for (let i = 1; i < sent.length; i++) expect(sent[i]!).toBeGreaterThanOrEqual(sent[i - 1]!);
  });
});

// ------------------------------------------------------------------ every combination

/** Every pair and triple flash.json lets the server pick (nothing it excludes together). */
function allowedCombos(): string[][] {
  const ids = FLASH_MODIFIERS.map((m) => m.id);
  const ok = (a: string, b: string): boolean => !(FLASH_MODIFIER_BY_ID[a]!.excludes ?? []).includes(b) && !(FLASH_MODIFIER_BY_ID[b]!.excludes ?? []).includes(a);
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      if (!ok(ids[i]!, ids[j]!)) continue;
      out.push([ids[i]!, ids[j]!]);
      for (let k = j + 1; k < ids.length; k++) if (ok(ids[i]!, ids[k]!) && ok(ids[j]!, ids[k]!)) out.push([ids[i]!, ids[j]!, ids[k]!]);
    }
  return out;
}

describe('FlashGames: every allowed pair and triple plays', () => {
  const combos = allowedCombos();
  it('has the pairs and triples', () => {
    expect(combos.some((c) => c.length === 2)).toBe(true);
    expect(combos.some((c) => c.length === 3)).toBe(true);
    expect(combos.some((c) => c.includes('glass') && c.includes('onelife'))).toBe(false);
  });
  // a third of the combinations per test so each stays well inside the time limit
  for (let part = 0; part < 3; part++) {
    it(`builds, fights a room, dies and gets up (part ${part + 1} of 3)`, () => {
      for (const [n, mods] of combos.entries()) {
        if (n % 3 !== part) continue;
        const seed = 1000 + n;
        const s = plan(mods, seed);
        const g = startSession(s);
        const ctl = new FlashController(s, { score: () => undefined, over: () => undefined, timeLeft: () => 0 });
        ctl.attach(g);
        ctl.go();
        const p0 = g.localPlayer!;
        expect(p0.hp!.max, mods.join(',')).toBeGreaterThan(0);
        // the third fight room (Boss Rush Hour's challenger, if it is on)
        const id = fightRooms(g)[2] ?? fightRooms(g)[0]!;
        fight(g, id, 20);
        expect(g.roomPhase, mods.join(',')).toBe('cleared');
        ctl.frame();
        expect(ctl.score.points, mods.join(',')).toBeGreaterThan(0);
        // a death: back up at the bonfire (or the run is over)
        inCombat(g.w);
        rawDamage(g.w, g.localPlayer!, 1e9, 'physical', 0);
        ctl.died();
        if (ctl.running) {
          g.respawn();
          step(g, 0.5);
          const p = g.localPlayer! as Entity;
          expect(p.hp!.dead, mods.join(',')).toBe(false);
          expect(p.hp!.hp, mods.join(',')).toBe(p.hp!.max);
        } else expect(mods).toContain('onelife');
        setRunMods(null);
      }
    });
  }
});
