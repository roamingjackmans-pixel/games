// A charge's red bar is its whole hit area; sweeping beams hit as they swing past; grabs cannot chain-stun.
import { describe, expect, it } from 'vitest';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { PLAYER_DOT_DY, PLAYER_DOT_R, spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { CHARGE_REACH, LUNGE_REACH, startEnemyAttack } from '../../src/game/enemies/attacks';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitPlayer } from '../../src/game/combat/damage';
import { spawnTelegraphs } from '../../src/game/combat/telegraph';
import { TRAINING_DUMMY } from '../../src/data/enemies/special';
import { Rng } from '../../src/engine/rng';
import type { AttackDef, EnemyDef } from '../../src/game/types';

const RADIUS = 40;

function chargeAttack(move: AttackDef['move'], w = 110, l: number | 'room' = 380): AttackDef {
  return { id: 'test_charge', name: 'Test Charge', kind: 'red', pattern: { kind: 'line', w, l, anchor: 'self' }, move, windupMs: 600, recoverMs: 600, dmgMult: 1, type: 'physical', cooldownS: 5, range: [0, 900], weight: 1 } as AttackDef;
}

/** A charger at (300, 368) facing a far target on the +x axis, and a test player whose DOT sits at (dotX, dotY). */
function setup(atk: AttackDef, dotX: number, dotY: number): { w: World; charger: Entity; p: Entity; hits: () => number } {
  const w = new World('TEST', Room.empty());
  const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, dotX, dotY - PLAYER_DOT_DY);
  const far = spawnPlayer(w, newCharacter('knight', 'Far', 'p2', new Rng(2)), 1, false, 1200, 368);
  const def = { ...TRAINING_DUMMY, id: 'test_charger', attacks: [] } as unknown as EnemyDef;
  const charger = spawnEnemy(w, def, 300, 368, { tellS: 0 });
  charger.radius = RADIUS;
  charger.facing = 0;
  startEnemyAttack(w, charger, atk, far);
  let n = 0;
  return {
    w,
    charger,
    p,
    hits: () => {
      for (let i = 0; i < 200; i++) {
        stepWorld(w);
        for (const ev of w.events) if (ev.t === 'dmg' && ev.toPlayer && ev.targetId === p.id) n++;
        w.events.length = 0;
        if (!charger.en!.attack) break;
      }
      return n;
    },
  };
}

describe('a charge hits exactly inside its red bar', () => {
  const atk = chargeAttack({ kind: 'charge', distance: 380, speed: 760 });
  const reach = RADIUS + CHARGE_REACH;
  it('the bar runs the full travel plus the body’s reach', () => {
    const { charger } = setup(atk, 600, 600);
    const lane = charger.en!.attack!.lane!;
    expect(lane.l).toBeCloseTo(380 + reach);
    expect(lane.w).toBe(110);
  });
  it('a dot just outside the side of the bar is safe; just inside is hit', () => {
    const edge = 368 + 55;
    expect(setup(atk, 500, edge + PLAYER_DOT_R + 1).hits()).toBe(0);
    expect(setup(atk, 500, edge + PLAYER_DOT_R - 2).hits()).toBe(1);
  });
  it('a dot just past the end of the bar is safe; just before it is hit', () => {
    const end = 300 + 380 + reach;
    expect(setup(atk, end + PLAYER_DOT_R + 1, 368).hits()).toBe(0);
    expect(setup(atk, end - 2, 368).hits()).toBe(1);
  });
  it('a body that would graze a player beside a narrow bar does not hit them', () => {
    // the old body test reached radius + 22 + the player's 14 px: 76 px from the line, far past a 40 px bar
    const narrow = chargeAttack({ kind: 'charge', distance: 380, speed: 760 }, 40);
    expect(setup(narrow, 500, 368 + 20 + PLAYER_DOT_R + 1).hits()).toBe(0);
    expect(setup(narrow, 500, 368 + 20 + PLAYER_DOT_R - 2).hits()).toBe(1);
  });
  it('a lunge follows the same rule', () => {
    const lunge = { ...chargeAttack({ kind: 'lunge', distance: 160 }, 50, 160), windupMs: 500 } as AttackDef;
    const end = 300 + 160 + RADIUS + LUNGE_REACH;
    expect(setup(lunge, end + PLAYER_DOT_R + 1, 368).hits()).toBe(0);
    expect(setup(lunge, 400, 368 + 25 + PLAYER_DOT_R + 1).hits()).toBe(0);
    expect(setup(lunge, 400, 368 + 25 + PLAYER_DOT_R - 2).hits()).toBe(1);
  });
  it('a wall charge’s bar reaches the wall', () => {
    const { charger, w } = setup(chargeAttack({ kind: 'charge', untilWall: true, speed: 720 }, 100, 'room'), 600, 600);
    expect(charger.en!.attack!.lane!.l).toBeCloseTo(w.room.rayToWall(300, 368, 0));
  });
});

describe('a sweeping beam hits as it swings past (zone 7 lasers)', () => {
  function sweepHits(tickS: number): number {
    const w = new World('TEST', Room.empty());
    const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 640, 368 - PLAYER_DOT_DY);
    const d = spawnEnemy(w, TRAINING_DUMMY, 1000, 368, { tellS: 0 });
    const spec = emptySpec('pierce');
    spec.dmg = { magic: 10 };
    // starts pointing +x (away from the player, who is at 180°) and turns a full circle in 3 s
    spawnTelegraphs(w, { kind: 'sweep', angleDeg: 360, r: 'room', durationS: 3, anchor: 'self', tickS, w: 60, beamLine: true }, {
      ownerId: d.id,
      team: 1,
      kind: 'pierce',
      windupS: 0.5,
      spec,
      ctx: { ox: 1000, oy: 368, facing: 0, tx: 1200, ty: 368, players: [{ x: 640, y: 368 }], rng: new Rng(3), room: w.room, telegraphS: 0.5 },
    });
    let n = 0;
    for (let i = 0; i < 60 * 4; i++) {
      stepWorld(w);
      for (const ev of w.events) if (ev.t === 'dmg' && ev.toPlayer && ev.targetId === p.id) n++;
      w.events.length = 0;
    }
    return n;
  }
  it('a ticking beam strikes the player once as it passes over them', () => {
    expect(sweepHits(0.25)).toBe(1);
  });
  it('a coarse tick cannot skip the player either', () => {
    expect(sweepHits(0.5)).toBe(1);
  });
});

describe('grabs cannot chain-stun (0.5 s grace after a grab)', () => {
  function rig(): { w: World; p: Entity; grab: () => void; until: (t: number) => void } {
    const w = new World('TEST', Room.empty());
    const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 600, 368);
    const d = spawnEnemy(w, TRAINING_DUMMY, 640, 368, { tellS: 0 });
    const t0 = w.time;
    return {
      w,
      p,
      grab: () => {
        const s = emptySpec('red');
        s.dmg = { physical: 1 };
        s.grab = { holdS: 2, mult: 1 };
        hitPlayer(w, d.id, p, s, d.x, d.y);
      },
      until: (t: number) => {
        while (w.time < t0 + t - 1e-9) stepWorld(w);
      },
    };
  }
  it('a second grab at 1.5 s does nothing: free to move at 2 s', () => {
    const r = rig();
    r.grab();
    expect(r.p.pl!.state).toBe('held');
    r.until(1.5);
    r.grab();
    expect(r.p.pl!.holdUntil).toBeCloseTo(r.w.time - 1.5 + 2, 1);
    r.until(2.02);
    expect(r.p.pl!.state).not.toBe('held');
  });
  it('a grab at 2.25 s is shrugged off (grace until 2.5 s)', () => {
    const r = rig();
    r.grab();
    r.until(2.25);
    expect(r.p.pl!.state).not.toBe('held');
    r.grab();
    expect(r.p.pl!.state).not.toBe('held');
  });
  it('a grab at 2.55 s takes hold again', () => {
    const r = rig();
    r.grab();
    r.until(2.55);
    r.grab();
    expect(r.p.pl!.state).toBe('held');
  });
});
