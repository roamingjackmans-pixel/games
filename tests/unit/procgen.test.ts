import { describe, expect, it } from 'vitest';
import { generateZone, neighbourId, type ZoneLayout } from '../../src/game/procgen/zone';
import { planRoom, MAX_LIVE, MAX_PER_WAVE, roomCountMult, threatBudget } from '../../src/game/procgen/waves';
import { eliteRate } from '../../src/game/procgen/elite';
import { rollMimic } from '../../src/game/procgen/chests';
import { mixValid } from '../../src/game/procgen/mix';
import { ENEMIES, rosterOf } from '../../src/data/enemies';
import { zoneShardNeed, zoneShardYield } from '../../src/game/procgen/tuning';
import type { Side } from '../../src/game/room';

function reachableAll(L: ZoneLayout): boolean {
  const seen = new Set([L.startId]);
  const q = [L.startId];
  while (q.length) {
    const id = q.shift()!;
    for (const s of ['n', 's', 'e', 'w'] as Side[]) {
      const n = neighbourId(L, id, s);
      if (n && !seen.has(n.id)) {
        seen.add(n.id);
        q.push(n.id);
      }
    }
  }
  // the Training Hall and the Instructor's room off it are entered only at a new character's start
  return L.rooms.filter((r) => r.kind !== 'tutorial' && r.kind !== 'trial').every((r) => seen.has(r.id));
}

describe('procgen (PROCGEN §9)', () => {
  it('1,000 seeds generate every zone with reachable rooms and a dead-end boss room', () => {
    for (let s = 0; s < 1000; s++) {
      for (let z = 1; z <= 8; z++) {
        const L = generateZone(`seed-${s}`, z, { tutorial: z === 1 && s % 2 === 0 });
        expect(L.rooms.length).toBeGreaterThanOrEqual(12 + Math.floor(z / 2) + 1);
        expect(reachableAll(L)).toBe(true);
        const boss = L.byId[L.bossId]!;
        expect(boss.kind).toBe('boss');
        expect(boss.doors.length).toBe(1);
        expect(L.byId[L.anteroomId]!.kind).toBe('anteroom');
        if (z === 1 && s % 2 === 0) {
          expect(L.tutorialId).not.toBeNull();
          // the Instructor's room is the hall's south door, and leads back to it (D75)
          expect(neighbourId(L, L.tutorialId!, 'e')?.id).toBe(L.trialId);
          expect(neighbourId(L, L.trialId!, 'w')?.id).toBe(L.tutorialId);
          expect(neighbourId(L, L.trialId!, 'e')?.id).toBe(L.startId);
        } else expect(L.trialId).toBeNull();
      }
    }
  });
  it('is deterministic for a seed', () => {
    const a = generateZone('SAME', 3);
    const b = generateZone('SAME', 3);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });
  it('mixes are valid and waves never exceed the live cap', () => {
    for (let s = 0; s < 300; s++) {
      for (let z = 1; z <= 8; z++) {
        if (rosterOf(z).length < 8) continue;
        const L = generateZone(`w-${s}`, z);
        expect(mixValid(L.mix.map((id) => ENEMIES[id]!))).toBe(true);
        for (const r of L.rooms) {
          const plan = planRoom(L, r);
          for (const w of plan.waves) expect(w.length).toBeLessThanOrEqual(MAX_PER_WAVE);
          // a wave starts when the previous one is 70% dead: 30% left + the new wave
          for (let i = 1; i < plan.waves.length; i++) expect(Math.ceil(plan.waves[i - 1]!.length * 0.3) + plan.waves[i]!.length).toBeLessThanOrEqual(MAX_LIVE);
          if (plan.ambush) expect(plan.waves.reduce((a, w) => a + w.length, 0)).toBeLessThanOrEqual(MAX_LIVE * 2);
          expect(plan.waves.flat().filter((u) => u.elite).length).toBeLessThanOrEqual(2);
        }
      }
    }
  });
  it('mimic rate over 10,000 chests is 8% ± 0.6% (D105)', () => {
    let n = 0;
    for (let i = 0; i < 10000; i++) if (rollMimic('mimics', i)) n++;
    expect(n / 10000).toBeGreaterThan(0.074);
    expect(n / 10000).toBeLessThan(0.086);
  });
  it('Shard tuning: a full zone clear yields 100% ± 20% of the levels for that zone (GAME_DESIGN §2.3)', () => {
    for (let z = 1; z <= 8; z++) {
      if (rosterOf(z).length < 8) continue;
      const avg = zoneShardYield(z, 100);
      const need = zoneShardNeed(z);
      const ratio = avg / need;
      expect(ratio, `zone ${z}: yield ${avg.toFixed(0)} vs needed ${need} (ratio ${ratio.toFixed(2)})`).toBeGreaterThan(0.8);
      expect(ratio, `zone ${z}: yield ${avg.toFixed(0)} vs needed ${need} (ratio ${ratio.toFixed(2)})`).toBeLessThan(1.2);
    }
  });
});

describe('room size and Elites by party size (D79)', () => {
  const plans = (players: number): { units: number; elites: number; rooms: number } => {
    let units = 0;
    let elites = 0;
    let rooms = 0;
    for (let s = 0; s < 120; s++) {
      for (const z of [1, 4, 7]) {
        const L = generateZone(`party-${s}`, z);
        for (const r of L.rooms) {
          if (r.kind !== 'combat' && r.kind !== 'ambush') continue;
          const plan = planRoom(L, r, players);
          rooms++;
          for (const w of plan.waves) {
            units += w.length;
            elites += w.filter((u) => u.elite).length;
            expect(w.length).toBeLessThanOrEqual(12 * players);
          }
        }
      }
    }
    return { units, elites, rooms };
  };
  it('each extra player adds about 20% more enemies: ×1.2, ×1.4, ×1.6 (D150)', () => {
    const one = plans(1);
    for (const p of [2, 3, 4]) {
      const more = plans(p);
      const want = 1 + 0.2 * (p - 1);
      expect(more.units / one.units, `${p} players`).toBeGreaterThan(want * 0.88);
      expect(more.units / one.units, `${p} players`).toBeLessThan(want * 1.12);
    }
  });
  it('rooms hold about 50% more enemies than the original budget', () => {
    expect(roomCountMult(1)).toBe(1.5);
    let now = 0;
    let before = 0;
    for (let s = 0; s < 60; s++) {
      const L = generateZone(`size-${s}`, 3);
      for (const r of L.rooms) {
        if (r.kind !== 'combat') continue;
        now += threatBudget(Math.max(1, r.depth), 3) * roomCountMult(1);
        before += threatBudget(Math.max(1, r.depth), 3);
      }
    }
    expect(now / before).toBeCloseTo(1.5, 6);
  });
  it('Elites come more often with every extra player', () => {
    const rates = [1, 2, 3, 4].map((p) => {
      const r = plans(p);
      return r.elites / r.units;
    });
    for (let i = 1; i < 4; i++) expect(rates[i]!, `${i + 1} players`).toBeGreaterThan(rates[i - 1]!);
    expect(eliteRate(4)).toBeCloseTo(0.2, 6);
  });
});
