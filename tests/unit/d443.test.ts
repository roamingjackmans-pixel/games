// D444–D448: a dodge carries you over harmful ground; a stopped enemy walks round what stopped it; Archmagister Tock's
// and Foreman Ignatius's new attacks; the Greatsword's new name reaches pieces already found.
import { describe, expect, it } from 'vitest';
import { ARCHMAGISTER_TOCK } from '../../src/data/bosses/citadel';
import { FOREMAN_IGNATIUS } from '../../src/data/bosses/forge';
import { WEAPONS } from '../../src/data/weapons';
import { Rng } from '../../src/engine/rng';
import { enemyAttackSpec } from '../../src/game/enemies/attacks';
import { makeItem } from '../../src/game/items/make';
import { newCharacter } from '../../src/game/player/character';
import { PLAYER_DOT_DY, refreshDerived } from '../../src/game/player/player';
import { newSave, normalizeSave } from '../../src/game/save/schema';
import { GameSession } from '../../src/game/session';
import { stepWorld } from '../../src/game/sim';
import { spawnHazard } from '../../src/game/systems/hazards';
import { hitPlayer } from '../../src/game/combat/damage';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { TILE, ROOM_Y0, T } from '../../src/game/room';
import type { AttackDef, BossDef, HazardId } from '../../src/game/types';
import type { Entity } from '../../src/game/world';

function session(zone = 2): GameSession {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('d443'));
  ch.tutorialDone = true;
  const save = newSave(1, ch, 'D443-SEED');
  save.world.zone = zone;
  save.world.respawnBonfireId = `z${zone}-start`;
  const s = new GameSession(save);
  s.start();
  return s;
}
const run = (s: GameSession, sec: number): void => {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
};
const attackOf = (def: BossDef, id: string): AttackDef => {
  const a = def.phases.flatMap((p) => p.attacks).find((x) => x.id === id);
  if (!a) throw new Error(`no attack ${id}`);
  return a;
};

describe('a dodge carries you over harmful ground (D444)', () => {
  /** A player in a hostile room with one hazard under its feet, dodging or standing. */
  const standIn = (hazard: HazardId, dodging: boolean): { hurt: number; slowed: boolean; poison: number } => {
    const s = session();
    const w = s.w;
    const p = s.localPlayer!;
    const foe = spawnEnemy(w, ENEMIES.sporeling!, p.x + 500, p.y, { tellS: 0 });
    foe.en!.rootUntil = 1e9;
    foe.en!.phaseAttacks = [];
    foe.en!.state = 'alert';
    w.refreshLists();
    spawnHazard(w, hazard, [{ k: 'circle', x: p.x, y: p.y + PLAYER_DOT_DY, r: 90 }], 5, 1, foe.id);
    const before = p.hp!.hp;
    let slowed = false;
    for (let i = 0; i < 20; i++) {
      if (dodging) {
        p.pl!.state = 'dodge';
        p.pl!.stateUntil = w.time + 1;
      }
      stepWorld(w);
      if (p.pl!.timeSlow < 1) slowed = true;
    }
    return { hurt: before - p.hp!.hp, slowed, poison: p.st?.meters.poison ?? 0 };
  };

  it('the Weaver’s purple lines, lava, burning ground and gas do nothing to a dodging player', () => {
    for (const hz of ['tendril', 'lava', 'fireWall', 'firePuddle', 'acid'] as HazardId[]) {
      expect(standIn(hz, false).hurt, `${hz} standing`).toBeGreaterThan(0);
      expect(standIn(hz, true).hurt, `${hz} dodging`).toBe(0);
    }
    expect(standIn('tendril', false).slowed).toBe(true);
    expect(standIn('tendril', true).slowed).toBe(false);
    expect(standIn('poisonCloud', false).poison).toBeGreaterThan(0);
    expect(standIn('poisonCloud', true).poison).toBe(0);
  });

  it('counts for the whole dodge, even past a heavy load’s short i-frames; a Piercing strike still lands', () => {
    const s = session();
    const w = s.w;
    const p = s.localPlayer!;
    const foe = spawnEnemy(w, ENEMIES.sporeling!, p.x + 500, p.y, { tellS: 0 });
    w.refreshLists();
    p.pl!.state = 'dodge';
    p.pl!.iframesFrom = p.pl!.iframesUntil = 0;
    const lane = enemyAttackSpec(foe, attackOf(FOREMAN_IGNATIUS, 'ign_stoke'));
    expect(lane.ground).toBe(true);
    expect(hitPlayer(w, foe.id, p, lane, foe.x, foe.y)).toBe('dodged');
    const blue = enemyAttackSpec(foe, attackOf(FOREMAN_IGNATIUS, 'ign_flame_pillars'));
    expect(blue.ground).toBeUndefined();
    expect(hitPlayer(w, foe.id, p, blue, foe.x, foe.y)).not.toBe('dodged');
  });
});

describe('a stopped enemy goes round what stopped it (D445)', () => {
  /** Archmagister Tock pressed against a pillar with the player straight behind it. */
  const wedged = (fromSide: number): { s: GameSession; b: Entity; p: Entity; x0: number; y0: number } => {
    const s = session(7);
    s.w.god = true;
    s.enterRoom(s.layout.bossId, 's');
    run(s, 1.7);
    const b = s.w.get(s.w.bossId)!;
    const p = s.localPlayer!;
    // the north-west pillar, tiles 5–6 × 5–6
    const px = 6 * TILE;
    const py = ROOM_Y0 + 6 * TILE;
    expect(s.w.room.get(5, 5)).not.toBe(T.Floor);
    b.x = px + fromSide * (TILE + b.radius * 0.8 + 1);
    b.y = py;
    p.x = px - fromSide * (TILE + 40);
    p.y = py;
    b.en!.phaseAttacks = [];
    return { s, b, p, x0: b.x, y0: b.y };
  };
  it('Archmagister Tock, pinned behind a pillar, gets out from behind it', () => {
    for (const side of [1, -1]) {
      const { s, b, p, x0, y0 } = wedged(side);
      let far = 0;
      let sees = false;
      for (let i = 0; i < 60 * 8; i++) {
        stepWorld(s.w);
        p.x = 6 * TILE - side * (TILE + 40);
        p.y = ROOM_Y0 + 6 * TILE;
        far = Math.max(far, Math.hypot(b.x - x0, b.y - y0));
        if (s.w.room.lineOfSight(b.x, b.y, p.x, p.y)) sees = true;
      }
      expect(far, `side ${side}`).toBeGreaterThan(60);
      expect(sees, `side ${side}`).toBe(true);
    }
  });
  it('with its attacks on, it stops attacking from behind the pillar and comes out', () => {
    const { s, b, p } = wedged(1);
    b.en!.phaseAttacks = ARCHMAGISTER_TOCK.phases[0]!.attacks;
    let sees = false;
    for (let i = 0; i < 60 * 12 && !sees; i++) {
      stepWorld(s.w);
      p.x = 6 * TILE - (TILE + 40);
      p.y = ROOM_Y0 + 6 * TILE;
      p.hp!.hp = p.hp!.max;
      sees = s.w.room.lineOfSight(b.x, b.y, p.x, p.y);
    }
    expect(sees).toBe(true);
  });
  it('a body that ended up inside a pillar slides out of it and moves again', () => {
    const { s, b, p } = wedged(1);
    b.x = 6 * TILE + 34;
    b.y = ROOM_Y0 + 6 * TILE + 34;
    const r = b.radius * 0.8;
    expect(s.w.room.circleBlocked(b.x, b.y, r, true)).toBe(true);
    const x0 = b.x;
    const y0 = b.y;
    for (let i = 0; i < 60 * 3; i++) {
      stepWorld(s.w);
      p.x = 900;
      p.y = 400;
    }
    expect(s.w.room.circleBlocked(b.x, b.y, r, true)).toBe(false);
    expect(Math.hypot(b.x - x0, b.y - y0)).toBeGreaterThan(40);
  });
  it('a walker in reach behind a pillar comes round it instead of standing there', () => {
    const s = session(7);
    s.w.god = true;
    s.enterRoom(s.layout.bossId, 's');
    run(s, 1.7);
    const p = s.localPlayer!;
    const px = 6 * TILE;
    const py = ROOM_Y0 + 6 * TILE;
    p.x = px - TILE - 30;
    p.y = py;
    const foe = spawnEnemy(s.w, { ...ENEMIES.sporeling!, attacks: [], preferredRange: 150, moveStyle: 'walk' }, px + TILE + 30, py, { tellS: 0 });
    foe.en!.state = 'alert';
    s.w.refreshLists();
    let sees = false;
    for (let i = 0; i < 60 * 7 && !sees; i++) {
      stepWorld(s.w);
      p.x = px - TILE - 30;
      p.y = py;
      sees = s.w.room.lineOfSight(foe.x, foe.y, p.x, p.y);
    }
    expect(sees).toBe(true);
  });
});

describe('the bosses’ new attacks (D446, D447)', () => {
  it('Tock: the corner lasers charge 30% longer; a wide, slow yellow cone that parries replaces the scatter shot', () => {
    expect(attackOf(ARCHMAGISTER_TOCK, 'tock_laser_sweep').windupMs).toBe(1300);
    const ids = ARCHMAGISTER_TOCK.phases.flatMap((p) => p.attacks.map((a) => a.id));
    expect(ids).not.toContain('tock_arcane_volley');
    for (const ph of ARCHMAGISTER_TOCK.phases) {
      const wave = ph.attacks.find((a) => a.id === 'tock_arcane_wave')!;
      expect(wave.kind).toBe('normal');
      expect(wave.parryable).toBe(true);
      expect(wave.pattern?.kind).toBe('cone');
      expect(wave.windupMs).toBeGreaterThanOrEqual(1000);
    }
  });

  it('a raised shield parries Tock’s wave and Ignatius’s yellow attacks', () => {
    const s = session(5);
    const w = s.w;
    const p = s.localPlayer!;
    const foe = spawnEnemy(w, ENEMIES.sporeling!, p.x + 100, p.y, { tellS: 0 });
    w.refreshLists();
    p.facing = 0;
    refreshDerived(p);
    expect(p.pl!.derived.shield?.parryS).toBeGreaterThan(0);
    for (const a of [attackOf(ARCHMAGISTER_TOCK, 'tock_arcane_wave'), attackOf(FOREMAN_IGNATIUS, 'ign_golem_slam'), attackOf(FOREMAN_IGNATIUS, 'ign_stoke')]) {
      p.pl!.parryUntil = w.time + 1;
      expect(hitPlayer(w, foe.id, p, enemyAttackSpec(foe, a), foe.x, foe.y), a.id).toBe('parried');
    }
  });
});

describe('the Greatsword (D448)', () => {
  it('is what the class is called; its id, grades and damage stay', () => {
    const g = WEAPONS.longsword!;
    expect(g.name).toBe('Greatsword');
    expect(g.grades).toEqual({ bonk: 'B', slicey: 'B' });
    expect(g.base1).toBe(38);
  });

  it('pieces already found take the new name when a save loads', () => {
    const c = newCharacter('knight', 'Joe', 'p1', new Rng('name'));
    const old = ['Long', 'sword'].join('');
    const worn = makeItem('longsword', 'rare', 3, { sockets: 0 });
    worn.name = `Swift ${old} of Haste`;
    const bag = makeItem('longsword', 'common', 1, { sockets: 0 });
    bag.name = old;
    c.equipment.main = worn;
    c.bag.push(bag);
    const save = normalizeSave(newSave(1, c, 'NAME'));
    expect(save.character.equipment.main!.name).toBe('Swift Greatsword of Haste');
    expect(save.character.bag.find((i) => i.id === bag.id)!.name).toBe('Greatsword');
  });
});
