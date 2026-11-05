import { describe, expect, it } from 'vitest';
import { ROSTER_SIZE, validateData } from '../../src/data/validate';
import { MELEE_ROLES } from '../../src/game/types';
import { hasKind } from '../../src/game/procgen/mix';
import { hasDraw } from '../../src/engine/draw/registry';
import '../../src/engine/draw/enemies';
import { ENEMIES, rosterOf } from '../../src/data/enemies';
import { ZONES, zoneDef } from '../../src/data/zones';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy, spawnUnit } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { specialsInWindup } from '../../src/game/enemies/ai';
import { installRules } from '../../src/game/rules';
import { rollElite } from '../../src/game/procgen/elite';
import { mixValid, pickMix } from '../../src/game/procgen/mix';
import { Rng, stream } from '../../src/engine/rng';
import { mimicBite } from '../../src/game/interact';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';

function arena(): { w: World; p: ReturnType<typeof spawnPlayer> } {
  const w = new World('ENEMY-TEST', Room.empty());
  const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(2)), 0, true, 640, 368);
  installRules(w, { onPlayerDown: (_w, e) => (e.hp!.hp = e.hp!.max), zoneFodder: () => ENEMIES.shambler ?? null });
  w.god = true;
  return { w, p };
}

describe('data validation (CONTENT_ENEMIES §13)', () => {
  it('has no issues for the registered content', () => {
    const issues = validateData();
    expect(issues.map((i) => `${i.where}: ${i.msg}`)).toEqual([]);
  });
  it('every zone has 10 enemy types, 80 in all, each drawn', () => {
    expect(ROSTER_SIZE).toBe(10);
    let total = 0;
    for (const z of ZONES) {
      expect(z.enemies.length, z.name).toBe(10);
      expect(new Set(z.enemies).size, z.name).toBe(10);
      expect(rosterOf(z.id).map((d) => d.id).sort(), z.name).toEqual([...z.enemies].sort());
      for (const id of z.enemies) {
        expect(ENEMIES[id], id).toBeDefined();
        expect(hasDraw(ENEMIES[id]!.draw), `${id} draws as ${ENEMIES[id]!.draw}`).toBe(true);
      }
      total += z.enemies.length;
    }
    expect(total).toBe(80);
    expect(new Set(ZONES.flatMap((z) => z.enemies)).size).toBe(80);
    expect(rosterOf(1).length).toBe(10);
    for (const id of zoneDef(1).enemies) expect(ENEMIES[id], id).toBeDefined();
  });
  it('every roster keeps melee and non-melee roles and at least two Red and two Piercing users (PROCGEN §4)', () => {
    for (const z of ZONES) {
      const roster = rosterOf(z.id);
      expect(roster.filter((d) => MELEE_ROLES.includes(d.role)).length, z.name).toBeGreaterThanOrEqual(2);
      expect(roster.filter((d) => !MELEE_ROLES.includes(d.role)).length, z.name).toBeGreaterThanOrEqual(2);
      expect(roster.filter((d) => hasKind(d, 'red')).length, z.name).toBeGreaterThanOrEqual(2);
      expect(roster.filter((d) => hasKind(d, 'pierce')).length, z.name).toBeGreaterThanOrEqual(2);
    }
  });
  it('the mix picker always returns a valid mix for registered zones', () => {
    for (const z of ZONES) {
      const roster = rosterOf(z.id);
      if (roster.length < 8) continue;
      for (let s = 0; s < 1000; s++) expect(mixValid(pickMix(stream(`seed${s}`, `rooms:${z.id}`), roster))).toBe(true);
    }
  });
});

describe('elites (GAME_DESIGN §6.4)', () => {
  it('8% ± 1 of eligible spawns are elite', () => {
    const r = new Rng('elite');
    const def = ENEMIES.shambler!;
    let n = 0;
    const N = 100000;
    for (let i = 0; i < N; i++) if (rollElite(r, def, 0)) n++;
    expect(n / N).toBeGreaterThan(0.07);
    expect(n / N).toBeLessThan(0.09);
  });
  it('never on swarms or past 2 per room', () => {
    const r = new Rng('elite2');
    for (let i = 0; i < 1000; i++) {
      expect(rollElite(r, ENEMIES.crypt_rat_swarm!, 0)).toBeNull();
      expect(rollElite(r, ENEMIES.shambler!, 2)).toBeNull();
    }
  });
  it('every elite affix spawns and fights for 10 s without errors', () => {
    for (const affix of ['frenzied', 'armored', 'vampiric', 'arcane', 'molten', 'frostbound', 'shielded', 'summoner'] as const) {
      const { w } = arena();
      const e = spawnEnemy(w, ENEMIES.gravedigger!, 800, 368, { elite: affix, tellS: 0.1 });
      for (let i = 0; i < 600; i++) stepWorld(w);
      expect(e.hp!.max).toBeGreaterThan(ENEMIES.gravedigger ? 180 * 2.9 : 0);
    }
  });
});

describe('AI', () => {
  it('never exceeds the room special budget', () => {
    const { w } = arena();
    w.specialBudget = 2;
    const ids = ['shambler', 'gravedigger', 'ghoul_leaper', 'bone_archer', 'hollow_knight', 'plague_bell', 'will_o_wisp'];
    let k = 0;
    for (let i = 0; i < 12; i++) spawnEnemy(w, ENEMIES[ids[k++ % ids.length]!]!, 200 + (i % 6) * 160, i < 6 ? 150 : 600, { tellS: 0.1 });
    let maxSeen = 0;
    for (let i = 0; i < 60 * 30; i++) {
      stepWorld(w);
      maxSeen = Math.max(maxSeen, specialsInWindup(w));
    }
    expect(maxSeen).toBeLessThanOrEqual(2);
    expect(maxSeen).toBeGreaterThan(0);
  });
  it('each Crypt enemy spawns, attacks and can be killed', () => {
    for (const def of rosterOf(1)) {
      const { w, p } = arena();
      const units = spawnUnit(w, def, 820, 368, { tellS: 0.1 });
      let attacked = false;
      for (let i = 0; i < 60 * 12; i++) {
        stepWorld(w);
        if (units.some((u) => u.en?.attack)) attacked = true;
      }
      expect(attacked, def.id).toBe(true);
      for (const u of units) {
        const s = emptySpec('player');
        s.dmg.holy = 99999;
        hitEnemy(w, p, u, s, p.x, p.y);
      }
      stepWorld(w);
      expect(w.livingEnemies().length, def.id).toBe(0);
    }
  });
  it('each enemy added with the 10-type rosters spawns, uses its Red or Piercing special and can be killed', () => {
    const added = ['weeping_mourner', 'pallbearer', 'lanternjaw', 'lichen_hermit', 'sewer_diver', 'fuse_eel', 'hollow_scarecrow', 'hollow_beekeeper', 'rivet_gunner', 'crucible_bearer', 'rime_moths', 'frozen_censer', 'cuckoo_clock', 'clockwork_butler', 'fine_print', 'bailiff'];
    for (const id of added) {
      const def = ENEMIES[id]!;
      expect(zoneDef(def.zone).enemies, id).toContain(id);
      const { w, p } = arena();
      const stationary = def.moveStyle === 'stationary';
      const units = spawnUnit(w, def, stationary ? 720 : 900, 368, { tellS: 0.1 });
      const used = new Set<string>();
      for (let i = 0; i < 60 * 40 && !def.attacks.every((a) => a.kind === 'utility' || used.has(a.id)); i++) {
        stepWorld(w);
        for (const u of units) if (u.en?.attack) used.add(u.en.attack.def.id);
      }
      for (const a of def.attacks) if (a.kind !== 'utility') expect(used.has(a.id), `${id} never used ${a.id}`).toBe(true);
      for (const u of units) {
        const s = emptySpec('player');
        s.dmg.holy = 99999;
        hitEnemy(w, p, u, s, u.x - 30, u.y);
      }
      stepWorld(w);
      expect(w.livingEnemies().length, id).toBe(0);
    }
  });
  it('a swarm spawns its pieces as one group', () => {
    const { w } = arena();
    const pieces = spawnUnit(w, ENEMIES.crypt_rat_swarm!, 900, 368);
    expect(pieces.length).toBe(6);
    expect(new Set(pieces.map((p) => p.en!.groupId)).size).toBe(1);
  });
  it('Plague Bell raises a fallen enemy', () => {
    const { w, p } = arena();
    spawnEnemy(w, ENEMIES.plague_bell!, 1000, 200, { tellS: 0.1 });
    const s = spawnEnemy(w, ENEMIES.shambler!, 300, 600, { tellS: 0.1 });
    stepWorld(w);
    const spec = emptySpec('player');
    spec.dmg.holy = 9999;
    hitEnemy(w, p, s, spec, p.x, p.y);
    let raised = false;
    for (let i = 0; i < 60 * 20; i++) {
      stepWorld(w);
      if (w.livingEnemies().some((e) => e.en!.def.id === 'shambler')) raised = true;
    }
    expect(raised).toBe(true);
  });
});

describe('mimic (GAME_DESIGN §6.5)', () => {
  it('stays dormant, wakes when attacked first', () => {
    const { w, p } = arena();
    const m = spawnEnemy(w, ENEMIES.mimic!, 760, 368, { tellS: 0.1 });
    for (let i = 0; i < 120; i++) stepWorld(w);
    expect(m.en!.state).toBe('dormant');
    expect(m.en!.attack).toBeNull();
    const s = emptySpec('player');
    s.dmg.physical = 10;
    hitEnemy(w, p, m, s, p.x, p.y);
    expect(m.en!.state).not.toBe('dormant');
    let attacked = false;
    for (let i = 0; i < 600; i++) {
      stepWorld(w);
      if (m.en!.attack) attacked = true;
    }
    expect(attacked).toBe(true);
  });
  it('eats the player who opens it (solo: lethal, bite after bite, D179)', () => {
    const w = new World('MIMIC', Room.empty());
    const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(2)), 0, true, 640, 368);
    let died = false;
    installRules(w, { onPlayerDown: () => (died = true) });
    const m = spawnEnemy(w, ENEMIES.mimic!, 680, 368, { tellS: 0.1 });
    for (let i = 0; i < 20; i++) stepWorld(w);
    mimicBite(w, p, m);
    expect(m.en!.state).not.toBe('dormant');
    expect(died).toBe(false);
    for (let i = 0; i < 60 * 8; i++) stepWorld(w);
    expect(died).toBe(true);
  });
});
