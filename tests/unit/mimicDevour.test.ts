// D179: a mimic drags in whoever opens it and bites 15% of their max HP each 0.7 s; solo it always kills, in co-op a
// partner can kill it to free them, and a victim taken to 0 is downed while the mimic climbs out to fight.
import { describe, expect, it } from 'vitest';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { installRules } from '../../src/game/rules';
import { MIMIC } from '../../src/data/enemies/special';
import { MIMIC_BITE_PCT, MIMIC_BITE_S, mimicBite } from '../../src/game/interact';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { Rng } from '../../src/engine/rng';

function setup(players: number): { w: World; ps: Entity[]; m: Entity; downed: string[] } {
  const w = new World('MIMIC', Room.empty());
  const downed: string[] = [];
  installRules(w, {
    onPlayerDown: (_w, p) => {
      p.pl!.downed = true;
      p.hp!.hp = 0;
      downed.push(p.pl!.playerId);
    },
  });
  const ps: Entity[] = [];
  for (let i = 0; i < players; i++) ps.push(spawnPlayer(w, newCharacter('knight', `P${i}`, `p${i}`, new Rng(i + 1)), i, i === 0, 400 + i * 60, 400));
  const m = spawnEnemy(w, MIMIC, 500, 400, { tellS: 0.05, mimicChestId: 'c1' });
  run(w, 0.5);
  return { w, ps, m, downed };
}
const run = (w: World, s: number): void => {
  for (let i = 0; i < Math.round(s * 60); i++) stepWorld(w);
};
const kill = (w: World, by: Entity, m: Entity): number => {
  const spec = emptySpec();
  spec.dmg.physical = 1e6;
  return hitEnemy(w, by, m, spec, by.x, by.y);
};

describe('a mimic eats whoever opens it (D179)', () => {
  it('drags you in and bites 15% of your max HP every 0.7 s', () => {
    const { w, ps, m } = setup(1);
    const p = ps[0]!;
    expect(m.en!.state).toBe('dormant');
    mimicBite(w, p, m);
    expect(p.pl!.state).toBe('held');
    expect(Math.hypot(p.x - m.x, p.y - m.y)).toBeLessThan(4);
    const max = p.hp!.max;
    run(w, MIMIC_BITE_S + 0.05);
    expect(p.hp!.hp).toBeCloseTo(max * (1 - MIMIC_BITE_PCT), 0);
    run(w, MIMIC_BITE_S);
    expect(p.hp!.hp).toBeCloseTo(max * (1 - 2 * MIMIC_BITE_PCT), 0);
  });

  it('solo: nothing can hurt it while it eats you, so it always kills', () => {
    const { w, ps, m, downed } = setup(1);
    mimicBite(w, ps[0]!, m);
    expect(kill(w, ps[0]!, m)).toBe(0);
    run(w, MIMIC_BITE_S * 8);
    expect(downed).toEqual(['p0']);
  });

  it('co-op: a partner who kills it frees you, alive', () => {
    const { w, ps, m, downed } = setup(2);
    const [a, b] = ps as [Entity, Entity];
    mimicBite(w, a, m);
    run(w, MIMIC_BITE_S * 2 + 0.05);
    expect(kill(w, b, m)).toBeGreaterThan(0);
    run(w, 0.1);
    expect(m.hp!.dead).toBe(true);
    expect(a.pl!.state).not.toBe('held');
    expect(a.pl!.downed).toBe(false);
    expect(a.hp!.hp).toBeGreaterThan(0);
    expect(downed).toEqual([]);
    expect(Math.hypot(a.x - m.x, a.y - m.y)).toBeGreaterThan(20);
  });

  it('co-op: bitten to 0 you are downed and it climbs out to fight the rest', () => {
    const { w, ps, m, downed } = setup(2);
    const a = ps[0]!;
    a.hp!.hp = a.hp!.max * 0.2;
    mimicBite(w, a, m);
    run(w, MIMIC_BITE_S * 2 + 0.1);
    expect(downed).toEqual(['p0']);
    expect(m.en!.devour).toBeNull();
    expect(m.en!.state).not.toBe('dormant');
    expect(m.en!.state).not.toBe('held');
    expect(m.hp!.dead).toBe(false);
  });
});
