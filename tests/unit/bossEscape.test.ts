// Every boss attack is avoidable (owner's rule, CONTENT_ENEMIES §13, D89): each Piercing pattern — and every
// ticking area of any colour, which i-frames cannot cover — leaves a walking player a way out from wherever the
// boss would start it, in every phase, in the real arena (pillars, grates, lava, the shrunk platform, moving
// floors, the flood and the pull). Red single hits are dodged and normal ones blocked, so they are not walked.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { PHASE_TRANSITION_S } from '../../src/game/combat/bossPhase';
import { BASE_WALK, ROOM_CX, ROOM_CY, behindGap, escapeReach, resolvePattern, shapeHit, waveFair } from '../../src/game/combat/patterns';
import { HAZARDS } from '../../src/game/systems/hazards';
import { T } from '../../src/game/room';
import { BOSSES } from '../../src/data/bosses';
import { simulateEscape, type EscapeWorld } from './escapeSim';
import type { AttackDef, BossDef } from '../../src/game/types';
import type { Entity } from '../../src/game/world';
import { Rng as R2 } from '../../src/engine/rng';

function session(zone: number): GameSession {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('esc'));
  ch.tutorialDone = true;
  const save = newSave(1, ch, 'ESCAPE-SEED');
  save.world.zone = zone;
  save.world.respawnBonfireId = `z${zone}-start`;
  const s = new GameSession(save);
  s.start();
  return s;
}
function run(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}
function quiet(s: GameSession, b: Entity): void {
  for (const a of b.en!.phaseAttacks) b.en!.cooldowns[a.id] = s.w.time + 9999;
  b.en!.attack = null;
}

/** The attacks a phase can throw, chained follow-ups included. */
function phaseAttacks(def: BossDef, phase: number): AttackDef[] {
  const out: AttackDef[] = [];
  const add = (a: AttackDef | undefined): void => {
    if (!a || out.some((x) => x.id === a.id)) return;
    out.push(a);
    add(a.chain);
  };
  for (const a of def.phases[phase]!.attacks) add(a);
  return out;
}

/** Walked rather than dodged: Piercing areas, and anything that keeps ticking. */
function mustWalk(a: AttackDef): boolean {
  const p = a.pattern;
  if (!p || p.kind === 'projectile' || p.kind === 'trail' || p.kind === 'melee' || a.kind === 'utility') return false;
  if (a.kind === 'pierce') return a.dmgMult > 0 || !!a.status || !!a.control;
  const specs = resolvePattern(p, { ox: 640, oy: 368, facing: 0, tx: 800, ty: 368, players: [{ x: 800, y: 368 }], rng: new R2('m'), room: null, telegraphS: 1 });
  return specs.some((s) => s.mode === 'tick' && s.activeS > 0.4);
}

function selfTracked(a: AttackDef): boolean {
  const p = a.pattern!;
  return (p.kind === 'line' || p.kind === 'cone' || p.kind === 'sweep' || p.kind === 'beam') && 'anchor' in p && p.anchor === 'self' && (('count' in p && p.count) || 1) === 1;
}

interface Failure {
  boss: string;
  phase: number;
  attack: string;
  from: string;
  at: string;
  t: number;
}

function auditBoss(zone: number): Failure[] {
  const s = session(zone);
  s.w.god = true;
  s.enterRoom(s.layout.bossId, 's');
  run(s, 1.7);
  const b = s.w.get(s.w.bossId)!;
  const def = b.en!.def as unknown as BossDef;
  const fails: Failure[] = [];
  for (let phase = 0; phase < def.phases.length; phase++) {
    if (phase > 0) {
      const spec = emptySpec('normal');
      spec.dmg.physical = b.hp!.max * 10;
      hitEnemy(s.w, s.localPlayer, b, spec, b.x, b.y + 50);
      run(s, PHASE_TRANSITION_S + 0.3);
    }
    quiet(s, b);
    const w = s.w;
    const room = w.room;
    // slows: the Sewers' water and the phase-2 flood; the Deep Lease's pull
    let walk = BASE_WALK;
    let wet = false;
    for (let y = 0; y < 22 && !wet; y++) for (let x = 0; x < 40; x++) if (room.get(x, y) === T.Hazard && room.hazardKind === 'water') wet = true;
    if (wet) walk *= 0.85;
    if (w.roomMods.floodUntil > w.time) walk *= 1 - w.roomMods.floodSlow;
    const pull = def.phases[phase]!.passive?.pull?.speed ?? 0;
    walk -= pull;
    // standing in a lasting damaging hazard (lava, thorn walls, ember moss) does not count as safe
    const lasting = [...w.entities.values()].filter((h) => h.type === 'hazard' && !h.removed && h.hz && h.hz.team === 1 && h.hz.until - w.time > 60 && HAZARDS[h.hz.hazard].dmg > 0);
    const blocked = (x: number, y: number): boolean => lasting.some((h) => h.hz!.shapes.some((sh) => shapeHit(sh, 0, x, y, 14, room)));
    // where the boss stands: its spot, and (walkers) out near a wall
    const spots: { x: number; y: number }[] = [{ x: b.x, y: b.y }];
    if (def.moveStyle !== 'stationary' && !def.phases[phase]!.passive?.stationaryAt) {
      const [x, y] = room.nearestFloor(b.x < 640 ? b.x + 330 : b.x - 330, b.y < 368 ? b.y + 200 : b.y - 200, b.radius);
      spots.push({ x, y });
    }
    const ews: EscapeWorld[] = spots.map((spot) => ({ room, boss: { x: spot.x, y: spot.y, r: b.radius }, walk, blocked }));
    for (const atk of phaseAttacks(def, phase)) {
      if (!mustWalk(atk)) continue;
      for (const [si, spot] of spots.entries()) {
        const ew = ews[si]!;
        for (const d of [b.radius + 26, 170, 340])
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2 + 0.3;
            const x = spot.x + Math.cos(a) * d;
            const y = spot.y + Math.sin(a) * d;
            if (room.circleBlocked(x, y, 14) || room.isFallAt(x, y) || blocked(x, y)) continue;
            if (d > atk.range[1] || d < atk.range[0]) continue;
            // the attack's own fairness gates (DATA_MODEL §3): grates in reach for waves, the ring reachable
            const p = atk.pattern!;
            const ctx = { ox: spot.x, oy: spot.y, facing: 0, tx: x, ty: y, players: [{ x, y }], rng: new R2('g'), room, telegraphS: atk.windupMs / 1000 };
            if (!waveFair(p, ctx)) continue;
            if (p.kind === 'expandingRing' && p.gapBehind && !behindGap({ ...ctx, facing: Math.atan2(y - spot.y, x - spot.x) }, spot.x, spot.y).fair) continue;
            if (atk.condition === 'ringReachable' && p.kind === 'ring') {
              const reach = escapeReach(atk.windupMs / 1000, p.pullSpeed ?? 0);
              if (Math.hypot(x - ROOM_CX, y - ROOM_CY) - p.rIn > reach) continue;
            }
            for (const seed of ['a', 'b']) {
              const r = simulateEscape(atk, { x, y }, ew, `${atk.id}:${seed}:${k}:${d}`, selfTracked(atk) ? (atk.windupMs / 1000) * 0.6 : 0);
              if (!r.ok) fails.push({ boss: def.id, phase: phase + 1, attack: atk.id, from: `${x.toFixed(0)},${y.toFixed(0)}`, at: `${spot.x.toFixed(0)},${spot.y.toFixed(0)}`, t: +r.failAt.toFixed(2) });
            }
          }
      }
    }
  }
  return fails;
}

describe('every boss attack is avoidable (D89)', () => {
  it('the simulator catches the old Rain of Caps (6 lanes of 80 px: no gap a body fits in)', () => {
    const s = session(2);
    s.enterRoom(s.layout.bossId, 's');
    run(s, 1.7);
    const b = s.w.get(s.w.bossId)!;
    const def = b.en!.def as unknown as BossDef;
    const now = def.phases[1]!.attacks.find((a) => a.id === 'spore_rain_of_caps')!;
    const old: AttackDef = { ...now, pattern: { kind: 'lanes', n: 6, w: 80, orientation: 'horizontal', alternate: true, setGapS: 1.0 } };
    const ew: EscapeWorld = { room: s.w.room, boss: { x: b.x, y: b.y, r: b.radius }, walk: BASE_WALK };
    for (const start of [{ x: 300, y: 200 }, { x: 900, y: 500 }, { x: 640, y: 600 }]) {
      expect(simulateEscape(old, start, ew, 'old').ok).toBe(false);
      expect(simulateEscape(now, start, ew, 'new').ok).toBe(true);
    }
  });
  for (let zone = 1; zone <= 8; zone++) {
    const def = Object.values(BOSSES).find((d) => d?.zone === zone);
    it(`${def?.name ?? zone}: every Piercing or ticking area leaves a way out, in every phase`, () => {
      const fails = auditBoss(zone);
      // one line per attack is enough to read
      const seen = new Map<string, Failure>();
      for (const f of fails) if (!seen.has(`${f.phase}:${f.attack}`)) seen.set(`${f.phase}:${f.attack}`, f);
      expect([...seen.values()]).toEqual([]);
    });
  }
});
