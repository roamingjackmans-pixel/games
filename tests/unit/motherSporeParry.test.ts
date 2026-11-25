// D464: Mother Spore's Root Swipe, a root sweeping round her base, is her one parryable attack, in every phase: the
// first, the second, and the New Game+ third (which keeps the second's attacks). Parrying it staggers her (D454).
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { enemyAttackSpec } from '../../src/game/enemies/attacks';
import { hitPlayer } from '../../src/game/combat/damage';
import { ngBossDef } from '../../src/game/boss/ngPhases';
import { stepWorld } from '../../src/game/sim';
import { Rng } from '../../src/engine/rng';
import { BOSSES } from '../../src/data/bosses';

const parryable = (ids: { id: string; kind: string; parryable?: boolean }[]): string[] => ids.filter((a) => a.kind === 'normal' && a.parryable === true).map((a) => a.id);

describe("Mother Spore's Root Swipe (D464)", () => {
  it('is in every phase, the New Game+ third included, and is her only parryable attack', () => {
    const def = BOSSES.mother_spore!;
    for (const ph of def.phases) expect(parryable(ph.attacks)).toEqual(['spore_root_swipe']);
    const ng = ngBossDef(def, 1);
    expect(ng.phases.length).toBe(3);
    for (const ph of ng.phases) expect(parryable(ph.attacks)).toEqual(['spore_root_swipe']);
  });

  it('she swings it at a player beside her, and a parry staggers her', () => {
    const w = new World('SPORE-PARRY', Room.empty());
    const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng('spore')), 0, true, 520, 368);
    const def = BOSSES.mother_spore!;
    const boss = spawnEnemy(w, def, 640, 368, { tellS: 0, zone: def.zone });
    w.refreshLists();
    w.god = true;
    let swing = null;
    for (let i = 0; i < 60 * 40 && !swing; i++) {
      stepWorld(w);
      for (const e of w.enemies) if (!e.en?.isBoss) w.remove(e); // her Sporelings
      w.sweep();
      p.x = boss.x - 120;
      p.y = boss.y;
      p.facing = 0;
      const a = boss.en!.attack;
      if (a && a.phase === 'windup' && a.def.id === 'spore_root_swipe') swing = a.def;
    }
    expect(swing).not.toBeNull();
    p.pl!.parryUntil = w.time + 1;
    expect(hitPlayer(w, boss.id, p, enemyAttackSpec(boss, swing!), boss.x, boss.y)).toBe('parried');
    expect(boss.hp!.staggerUntil).toBeGreaterThan(w.time);
    expect(boss.en!.state).toBe('stagger');
  });
});
