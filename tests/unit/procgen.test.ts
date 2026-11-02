import { describe, expect, it } from 'vitest';
import { generateZone, neighbourId, type ZoneLayout } from '../../src/game/procgen/zone';
import { planRoom, planShards, MAX_LIVE, MAX_PER_WAVE } from '../../src/game/procgen/waves';
import { rollMimic } from '../../src/game/procgen/chests';
import { mixValid } from '../../src/game/procgen/mix';
import { ENEMIES, rosterOf } from '../../src/data/enemies';
import { ROLE_STATS, SHARD_SCALE, zoneShardFactor } from '../../src/data/roles';
import { enemyShardMult, levelCostRange } from '../../src/game/combat/formulas';
import type { Side } from '../../src/game/room';

const EXPECTED_LEVEL = [1, 12, 22, 32, 42, 52, 62, 72, 80];

export function zoneShardYield(z: number, seeds = 200): number {
  let tot = 0;
  for (let s = 0; s < seeds; s++) {
    const L = generateZone(`S${s}`, z, {});
    for (const r of L.rooms)
      tot += planShards(planRoom(L, r), (id) => ROLE_STATS[ENEMIES[id]!.role].shards * SHARD_SCALE * zoneShardFactor(z) * (ENEMIES[id]!.mult?.shards ?? 1) * enemyShardMult(z, 0));
  }
  return tot / seeds;
}

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
  return L.rooms.filter((r) => r.kind !== 'tutorial').every((r) => seen.has(r.id));
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
        if (z === 1 && s % 2 === 0) expect(L.tutorialId).not.toBeNull();
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
  it('mimic rate over 10,000 chests is 5% ± 0.5%', () => {
    let n = 0;
    for (let i = 0; i < 10000; i++) if (rollMimic('mimics', i)) n++;
    expect(n / 10000).toBeGreaterThan(0.045);
    expect(n / 10000).toBeLessThan(0.055);
  });
  it('Shard tuning: a full zone clear yields 100% ± 20% of the levels for that zone (GAME_DESIGN §2.3)', () => {
    for (let z = 1; z <= 8; z++) {
      if (rosterOf(z).length < 8) continue;
      const avg = zoneShardYield(z, 100);
      const need = levelCostRange(EXPECTED_LEVEL[z - 1]!, EXPECTED_LEVEL[z]!);
      const ratio = avg / need;
      expect(ratio, `zone ${z}: yield ${avg.toFixed(0)} vs needed ${need} (ratio ${ratio.toFixed(2)})`).toBeGreaterThan(0.8);
      expect(ratio, `zone ${z}: yield ${avg.toFixed(0)} vs needed ${need} (ratio ${ratio.toFixed(2)})`).toBeLessThan(1.2);
    }
  });
});
