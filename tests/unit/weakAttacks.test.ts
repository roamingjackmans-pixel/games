// No room enemy hits feebly next to its zone (D308): the Frozen Censer, Plague Bell, Choir Acolyte, Repair Drone and Pixie
// Swarm were raised. Measure: each enemy's damaging attacks (dmgMult > 0) as one hit each, at its own zone, in the
// first playthrough and NG+1 (the NG+ zone factors, D275/D287, apply to the whole roster alike).
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/data/enemies';
import { attackDamage, spawnEnemy } from '../../src/game/enemies/spawn';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};

interface Row {
  id: string;
  pieces: number;
  best: number;
  avg: number;
}

function zoneRows(zone: number, cycle: number): Row[] {
  const w = new World(`weak${zone}:${cycle}`, Room.empty());
  return Object.values(ENEMIES)
    .filter((d) => d.zone === zone && !d.special)
    .map((d) => {
      const e = spawnEnemy(w, d, 640, 300, { zone, cycle, players: 1 });
      const hits = d.attacks.filter((a) => a.dmgMult > 0).map((a) => attackDamage(e, a.dmgMult));
      return { id: d.id, pieces: d.swarm?.pieces ?? 1, best: Math.max(0, ...hits), avg: hits.length ? hits.reduce((s, x) => s + x, 0) / hits.length : 0 };
    });
}

describe('no feeble room enemies (D308)', () => {
  for (const cycle of [0, 1]) {
    for (let zone = 1; zone <= 8; zone++) {
      it(`zone ${zone}, ${cycle ? 'NG+1' : 'first playthrough'}`, () => {
        const rows = zoneRows(zone, cycle);
        const solo = rows.filter((r) => r.pieces === 1);
        const medBest = median(solo.map((r) => r.best));
        const medAvg = median(solo.map((r) => r.avg));
        for (const r of rows) {
          if (r.pieces === 1) {
            // a lone enemy's biggest hit is at least 55% of the zone's typical biggest hit, its average at least half
            expect(r.best / medBest, `${r.id} best`).toBeGreaterThanOrEqual(0.55);
            expect(r.avg / medAvg, `${r.id} average`).toBeGreaterThanOrEqual(0.5);
          } else {
            // a swarm is weak a piece by design; the whole swarm's biggest hits add up to at least 75%
            expect((r.best * r.pieces) / medBest, `${r.id} swarm`).toBeGreaterThanOrEqual(0.75);
          }
        }
      });
    }
  }
});
