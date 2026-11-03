// Moving floors in phase 2 (D95): an ArenaChange 'movingFloor' starts a ring or a conveyor belt that carries
// players and enemies alike, is synced to guests, drawn, and stops with the boss.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { PHASE_TRANSITION_S } from '../../src/game/combat/bossPhase';
import { applyArenaChanges } from '../../src/game/boss/arena';
import { carriedTo, floorSpeedAt, movingFloors } from '../../src/game/systems/movingFloor';
import { roomSync } from '../../src/game/net/snapshot';
import { BOSSES } from '../../src/data/bosses';
import type { BossDef, MovingFloorDef } from '../../src/game/types';
import type { Entity } from '../../src/game/world';

function session(zone: number): GameSession {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('mf'));
  ch.tutorialDone = true;
  const save = newSave(1, ch, 'FLOOR-SEED');
  save.world.zone = zone;
  save.world.respawnBonfireId = `z${zone}-start`;
  const s = new GameSession(save);
  s.start();
  return s;
}
function run(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}
function fight(zone: number): { s: GameSession; b: Entity; p: Entity } {
  const s = session(zone);
  s.w.god = true;
  s.enterRoom(s.layout.bossId, 's');
  run(s, 1.7);
  const b = s.w.get(s.w.bossId)!;
  return { s, b, p: s.localPlayer! };
}
function hold(s: GameSession, b: Entity): void {
  for (const a of b.en!.phaseAttacks) b.en!.cooldowns[a.id] = s.w.time + 999;
  b.en!.attack = null;
  b.en!.stunUntil = s.w.time + 60;
}
function toPhase2(s: GameSession, b: Entity): void {
  const spec = emptySpec('normal');
  spec.dmg.physical = b.hp!.max * 10;
  hitEnemy(s.w, s.localPlayer, b, spec, b.x, b.y + 50);
  run(s, PHASE_TRANSITION_S + 0.2);
}

describe('moving floors (D95)', () => {
  it('at least four bosses besides Tock start one when phase 2 begins', () => {
    const withFloor = Object.values(BOSSES).filter((d): d is BossDef => !!d && d.phases.slice(1).some((ph) => ph.arena?.some((c) => c.op === 'movingFloor' && !!c.floor)));
    expect(withFloor.map((d) => d.id).sort()).toEqual(['bloatking', 'foreman_ignatius', 'saint_aurelia', 'vexthorn']);
    // none in phase 1
    for (const d of withFloor) expect(d.phases[0]!.arena?.some((c) => c.op === 'movingFloor') ?? false).toBe(false);
  });
  for (const zone of [3, 4, 5, 6]) {
    it(`zone ${zone}: none in phase 1, the floor starts with phase 2, carries the player and stops with the boss`, () => {
      const { s, b, p } = fight(zone);
      expect(s.w.room.movers).toHaveLength(0);
      toPhase2(s, b);
      expect(s.w.room.movers.length).toBeGreaterThan(0);
      hold(s, b);
      const f = s.w.room.movers[0]!;
      // stand on the floor (a free spot on it) and let it carry you
      const spot = f.kind === 'ring' ? s.w.room.nearestFloor(f.x + (f.rIn + f.rOut) / 2, f.y, 14) : s.w.room.nearestFloor(f.x + f.w / 2, f.y + f.h / 2, 14);
      [p.x, p.y] = spot;
      b.x = 100;
      b.y = 650;
      const [ex, ey] = carriedTo(f, p.x, p.y, 0.5);
      const x0 = p.x;
      const y0 = p.y;
      run(s, 0.5);
      const moved = Math.hypot(p.x - x0, p.y - y0);
      expect(moved).toBeGreaterThan(Math.abs(f.speed) * 0.5 * 0.7);
      // the way the floor goes
      expect((p.x - x0) * (ex - x0) + (p.y - y0) * (ey - y0)).toBeGreaterThan(0);
      // guests get it with the room
      expect(roomSync(s.w, 'n', 'boss', zone, [], []).movers).toEqual(s.w.room.movers);
      // the kill stops it
      b.en!.stunUntil = 0;
      const spec = emptySpec('normal');
      spec.dmg.physical = b.hp!.max * 10;
      hitEnemy(s.w, p, b, spec, b.x, b.y + 50);
      run(s, 0.2);
      expect(b.hp!.dead).toBe(true);
      expect(s.w.room.movers).toHaveLength(0);
    });
  }
  it('enemies ride it too; flying bodies do not', () => {
    const { s, b } = fight(5);
    hold(s, b);
    const belt: MovingFloorDef = { kind: 'belt', x: 200, y: 150, w: 800, h: 64, dir: 'e', speed: 80, look: 'forge' };
    applyArenaChanges(s.w, [{ op: 'movingFloor', floor: belt }], b);
    expect(movingFloors(s.w.room).some((m) => m.kind === 'belt')).toBe(true);
    expect(floorSpeedAt(s.w.room, 400, 180)).toBe(80);
    expect(floorSpeedAt(s.w.room, 400, 400)).toBe(0);
    b.x = 560;
    b.y = 182;
    const x0 = b.x;
    run(s, 0.5);
    expect(b.x - x0).toBeGreaterThan(25);
    b.flying = true;
    const x1 = b.x;
    run(s, 0.5);
    expect(b.x).toBeCloseTo(x1, 1);
  });
  it('reverseFloor turns phase floors round as well as Tock’s ring', () => {
    const { s, b } = fight(6);
    applyArenaChanges(s.w, [{ op: 'movingFloor', floor: { kind: 'ring', x: 640, y: 368, rIn: 100, rOut: 200, speed: 50, look: 'ice' } }, { op: 'reverseFloor' }], b);
    expect(s.w.room.movers[0]!.speed).toBe(-50);
  });
});
